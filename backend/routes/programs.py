from datetime import datetime
import csv
import io
import os
import uuid
from typing import List, Optional

from routes.notification_helpers import (
    create_program_completion_notifications,
    send_notification_email,
)
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from database import get_db, supabase
from models import (
    ApplicationCheck,
    ApplicationCheckQuestion,
    ApplicationCheckAttempt,
    Assignment,
    AssignmentResource,
    AssignmentSubmission,
    Badge,
    Module,
    NotificationScript,
    Program,
    Quiz,
    QuizAttempt,
    QuizAttemptAnswer,
    QuizQuestion,
    RetentionQuiz,
    RetentionQuizQuestion,
    SurveyAnswer,
    SurveyCompletion,
    SurveyForm,
    SurveyOption,
    SurveyQuestion,
    SurveyResponse,
    SurveyTemplate,
    SurveyTemplateOption,
    SurveyTemplateQuestion,
    User,
    UserApplicationCheckProgress,
    UserBadge,
    UserNotification,
    UserProgramProgress,
    Video,
    VideoDocument,
    WrittenLesson,
    ApplicationCheckAutomationSetting,
)
from routes.audit_helpers import create_audit_log
from schemas import (
    ApplicationCheckResponse,
    ApplicationCheckUpdate,
    AssignmentCreate,
    AssignmentUpdate,
    BulkQuestionsInput,
    ModuleUpdate,
    ProgramCreate,
    RetentionQuizCreate,
    RetentionQuizResponse,
    RetentionQuizUpdate,
    SurveyDuplicateRequest,
    SurveyFormCreate,
    SurveyFormUpdate,
    SurveyQuestionCreate,
    SurveyTemplateCreate,
    SurveyTemplateResponse,
    VideoCreateSchema,
    VideoDocumentCreate,
    WrittenLessonCreate,
    WrittenLessonUpdate,
)

# ReportLab imports for memory-buffered PDF Generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

router = APIRouter(prefix="/programs", tags=["Programs"])


def create_program_published_notifications(
    program: Program,
    db: Session,
) -> int:
    script = (
        db.query(NotificationScript)
        .filter(
            NotificationScript.trigger_type == "program_published",
            NotificationScript.is_active == True,
        )
        .first()
    )

    if not script:
        return 0

    users = (
        db.query(User)
        .filter(User.is_active == True)
        .all()
    )

    count = 0

    for user in users:
        message = script.message.replace(
            "{programName}",
            program.name,
        )

        notification = UserNotification(
            user_id=user.user_id,
            script_id=script.id,
            program_id=program.id,
            title=script.title,
            message=message,
        )

        db.add(notification)

        if user.email:
            try:
                email_sent = send_notification_email(
                    to_email=user.email,
                    title=notification.title,
                    message=notification.message,
                )

                if email_sent:
                    print(
                        f"New Program Available email SENT to {user.email}"
                    )
                else:
                    print(
                        f"New Program Available email FAILED to send to {user.email}"
                    )

            except Exception as e:
                print(
                    f"New Program Available email ERROR for "
                    f"{user.email}: {e}"
                )
        count += 1
    return count


@router.post("/")
def create_program(
    request: ProgramCreate,
    http_request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None),
):

    try:
        program = Program(
            name=request.name,
            description=request.description,
            type=request.type,
            duration=request.duration,
            language=request.language,
            category=request.category,
            tags=request.tags,
            status=request.status,
            unlock_type=request.unlock_type,
            unlock_days=request.unlock_days,
            curos=request.curos,
            thumbnail=request.thumbnail,
        )

        db.add(program)
        db.flush()


        retention_quiz = RetentionQuiz(
            program_id=program.id,
        )
        db.add(retention_quiz)

        application_checks = [
            ApplicationCheck(
                program_id=program.id,
                check_number=1,
                unlock_after_days=30,
            ),
            ApplicationCheck(
                program_id=program.id,
                check_number=2,
                unlock_after_days=60,
            ),
            ApplicationCheck(
                program_id=program.id,
                check_number=3,
                unlock_after_days=90,
            ),
        ]
        for application_check in application_checks:
            db.add(application_check)

        db.commit()
        db.refresh(program)

        if program.status == "Draft":
            admin_users = (
                db.query(User)
                .filter(User.is_active == True, User.role_id.in_([1, 2]))
                .all()
            )

            for admin in admin_users:
                notification = UserNotification(
                    user_id=admin.user_id,
                    title="Draft Program Pending 📋",
                    message=f'You have a draft program "{program.name}". Click here to review and publish it.',
                    program_id=program.id,
                )

                db.add(notification)

            db.commit()

            print(
                "Draft program notification sent to Admin + Master Admin:",
                len(admin_users),
            )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create program: {str(e)}"
        )

    create_audit_log(
        db=db,
        request=http_request,
        actor_id=actor_id,
        actor_name=actor_name,
        action="program_created",
        entity_type="program",
        entity_id=program.id,
        message=f"Created program: {program.name}",
        metadata={
            "program_id": program.id,
            "name": program.name,
            "type": program.type,
            "status": program.status,
        },
    )

    return {"message": "Program created successfully", "id": program.id}


@router.get("/")
def get_programs(db: Session = Depends(get_db)):
    """Fetches all programs with their modules eagerly loaded."""
    return db.query(Program).options(joinedload(Program.modules)).all()

@router.post("/{program_id}/publish")
def publish_program(program_id: int, db: Session = Depends(get_db)):
    program = (
        db.query(Program)
        .filter(Program.id == program_id)
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    if program.status == "Published":
        return program

    if program.status != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only Draft programs can be published."
        )

    try:
        # Publish the program
        program.status = "Published"
        db.flush()

        # Create website notifications for learners
        notification_count = create_program_published_notifications(
            program=program,
            db=db,
        )

        # Save program + notifications
        db.commit()
        db.refresh(program)

        print(
            f"Program {program.id} published successfully. "
            f"Notifications created: {notification_count}"
        )

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to publish program: {str(e)}"
        )

    return program

@router.get(
    "/{program_id}/retention-quiz", response_model=RetentionQuizResponse
)
def get_retention_quiz(program_id: int, db: Session = Depends(get_db)):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(RetentionQuiz.program_id == program_id)
        .first()
    )

    if not retention_quiz:
        retention_quiz = RetentionQuiz(
            program_id=program_id
        )
        db.add(retention_quiz)
        db.commit()
        db.refresh(retention_quiz)

    questions = (
        db.query(RetentionQuizQuestion)
        .filter(RetentionQuizQuestion.retention_quiz_id == retention_quiz.id)
        .order_by(RetentionQuizQuestion.display_order, RetentionQuizQuestion.id)
        .all()
    )

    retention_quiz.questions = questions
    return retention_quiz


@router.put(
    "/{program_id}/retention-quiz", response_model=RetentionQuizResponse
)
def update_retention_quiz(
    program_id: int, payload: RetentionQuizUpdate, db: Session = Depends(get_db)
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    retention_quiz = (
        db.query(RetentionQuiz)
        .options(joinedload(RetentionQuiz.questions))
        .filter(RetentionQuiz.program_id == program_id)
        .first()
    )
    if not retention_quiz:
        retention_quiz = RetentionQuiz(
            program_id=program_id
        )
        db.add(retention_quiz)
        db.flush()

    try:
        if payload.curos is not None:
            retention_quiz.curos = payload.curos

        if payload.questions is not None:
            existing_questions = list(retention_quiz.questions)
            incoming_questions = payload.questions or []

            updated_questions = []
            for index, question_payload in enumerate(incoming_questions):
                if index < len(existing_questions):
                    question = existing_questions[index]
                    question.question = question_payload.question
                    question.response_format = question_payload.response_format
                    question.option_a = question_payload.option_a
                    question.option_b = question_payload.option_b
                    question.option_c = question_payload.option_c
                    question.option_d = question_payload.option_d
                    question.correct_answer = question_payload.correct_answer
                    question.explanation = question_payload.explanation
                    question.required = question_payload.required
                    question.display_order = (
                        question_payload.display_order or (index + 1)
                    )
                    updated_questions.append(question)
                else:
                    question = RetentionQuizQuestion(
                        retention_quiz_id=retention_quiz.id,
                        question=question_payload.question,
                        response_format=question_payload.response_format,
                        option_a=question_payload.option_a,
                        option_b=question_payload.option_b,
                        option_c=question_payload.option_c,
                        option_d=question_payload.option_d,
                        correct_answer=question_payload.correct_answer,
                        explanation=question_payload.explanation,
                        required=question_payload.required,
                        display_order=question_payload.display_order
                        or (index + 1),
                    )
                    db.add(question)
                    updated_questions.append(question)

            for question in existing_questions[len(incoming_questions) :]:
                db.delete(question)

        db.commit()
        db.refresh(retention_quiz)

        updated_quiz = (
            db.query(RetentionQuiz)
            .options(joinedload(RetentionQuiz.questions))
            .filter(RetentionQuiz.id == retention_quiz.id)
            .first()
        )
        return updated_quiz
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update retention quiz: {str(e)}",
        )


@router.get(
    "/{program_id}/application-check/{check_number}",
    response_model=ApplicationCheckResponse,
)
def get_application_check(
    program_id: int, check_number: int, db: Session = Depends(get_db)
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    application_check = (
        db.query(ApplicationCheck)
        .options(joinedload(ApplicationCheck.questions))
        .filter(
            ApplicationCheck.program_id == program_id,
            ApplicationCheck.check_number == check_number,
        )
        .first()
    )

    if not application_check:
        raise HTTPException(
            status_code=404, detail="Application check not found"
        )

    return application_check


@router.put(
    "/{program_id}/application-check/{check_number}",
    response_model=ApplicationCheckResponse,
)
def update_application_check(
    program_id: int,
    check_number: int,
    payload: ApplicationCheckUpdate,
    db: Session = Depends(get_db),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    application_check = (
        db.query(ApplicationCheck)
        .options(joinedload(ApplicationCheck.questions))
        .filter(
            ApplicationCheck.program_id == program_id,
            ApplicationCheck.check_number == check_number,
        )
        .first()
    )

    if not application_check:
        application_check = ApplicationCheck(
            program_id=program_id,
            check_number=check_number,
            unlock_after_days=check_number * 30,
        )

        db.add(application_check)
        db.flush()

    try:
        if payload.curos is not None:
            application_check.curos = payload.curos

        if payload.questions is not None:
            existing_questions = list(application_check.questions)
            incoming_questions = payload.questions or []

            for index, question_payload in enumerate(incoming_questions):
                if index < len(existing_questions):
                    question = existing_questions[index]
                    if question_payload.question is not None:
                        question.question = question_payload.question
                    if question_payload.display_order is not None:
                        question.display_order = question_payload.display_order
                else:
                    if question_payload.question is None:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Question text is required for new application check question {index + 1}",
                        )
                    question = ApplicationCheckQuestion(
                        application_check_id=application_check.id,
                        question=question_payload.question,
                        display_order=question_payload.display_order
                        or (index + 1),
                    )
                    db.add(question)

            for question in existing_questions[len(incoming_questions) :]:
                db.delete(question)

        db.commit()
        db.refresh(application_check)

        updated_check = (
            db.query(ApplicationCheck)
            .options(joinedload(ApplicationCheck.questions))
            .filter(ApplicationCheck.id == application_check.id)
            .first()
        )
        return updated_check
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update application check: {str(e)}",
        )


@router.get("/templates")
def get_survey_templates(db: Session = Depends(get_db)):
    try:
        surveys = (
            db.query(SurveyForm)
            .options(
                joinedload(SurveyForm.questions)
                .joinedload(SurveyQuestion.options)
            )
            .filter(SurveyForm.is_active == True, SurveyForm.is_reused == False)
            .order_by(SurveyForm.created_at.desc())
            .all()
        )

        return surveys

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{template_id}")
def get_single_survey_template(
    template_id: int, db: Session = Depends(get_db)
):
    """Returns a single template configuration blueprint for workspace preview rendering."""
    template = (
        db.query(SurveyTemplate)
        .options(
            joinedload(SurveyTemplate.questions).joinedload(
                SurveyTemplateQuestion.options
            )
        )
        .filter(SurveyTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(
            status_code=404, detail="Survey template not found"
        )
    return template


@router.post("/templates", response_model=SurveyTemplateResponse)
def create_survey_template(
    payload: SurveyTemplateCreate, db: Session = Depends(get_db)
):
    """Creates a standalone blueprint template configuration."""
    try:
        new_template = SurveyTemplate(
            title=payload.title, description=payload.description
        )
        db.add(new_template)
        db.flush()

        if payload.questions:
            for q_payload in payload.questions:
                new_q = SurveyTemplateQuestion(
                    template_id=new_template.id,
                    question=q_payload.question,
                    question_type=q_payload.question_type,
                    is_required=q_payload.is_required,
                    question_order=q_payload.question_order,
                )
                db.add(new_q)
                db.flush()

                if (
                    q_payload.question_type
                    in ["multiple_choice", "checkbox", "dropdown"]
                    and q_payload.options
                ):
                    for opt_payload in q_payload.options:
                        new_opt = SurveyTemplateOption(
                            question_id=new_q.id,
                            option_text=opt_payload.option_text,
                            option_order=opt_payload.option_order,
                        )
                        db.add(new_opt)

        db.commit()
        db.refresh(new_template)
        return new_template
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database write error for template: {str(e)}",
        )


@router.put("/templates/{template_id}", response_model=SurveyTemplateResponse)
def update_survey_template(
    template_id: int,
    payload: SurveyTemplateCreate,
    db: Session = Depends(get_db),
):
    """Updates basic parameters and isolates modifications without mutating live deployed instances."""
    db_template = (
        db.query(SurveyTemplate)
        .filter(SurveyTemplate.id == template_id)
        .first()
    )
    if not db_template:
        raise HTTPException(
            status_code=404, detail="Survey template not found"
        )

    try:
        db_template.title = payload.title
        db_template.description = payload.description

        old_questions = (
            db.query(SurveyTemplateQuestion)
            .filter(SurveyTemplateQuestion.template_id == template_id)
            .all()
        )
        for old_q in old_questions:
            db.query(SurveyTemplateOption).filter(
                SurveyTemplateOption.question_id == old_q.id
            ).delete()

        db.query(SurveyTemplateQuestion).filter(
            SurveyTemplateQuestion.template_id == template_id
        ).delete()

        if payload.questions:
            for q_payload in payload.questions:
                new_q = SurveyTemplateQuestion(
                    template_id=db_template.id,
                    question=q_payload.question,
                    question_type=q_payload.question_type,
                    is_required=q_payload.is_required,
                    question_order=q_payload.question_order,
                )
                db.add(new_q)
                db.flush()

                if (
                    q_payload.question_type
                    in ["multiple_choice", "checkbox", "dropdown"]
                    and q_payload.options
                ):
                    for opt_payload in q_payload.options:
                        new_opt = SurveyTemplateOption(
                            question_id=new_q.id,
                            option_text=opt_payload.option_text,
                            option_order=opt_payload.option_order,
                        )
                        db.add(new_opt)

        db.commit()
        db.refresh(db_template)
        return db_template
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database pipeline failure during template replacement: {str(e)}",
        )


@router.delete("/templates/{template_id}")
def delete_survey_template(template_id: int, db: Session = Depends(get_db)):
    """Purges a template blueprint configuration alongside its nested questions and options cleanly."""
    db_template = (
        db.query(SurveyTemplate)
        .filter(SurveyTemplate.id == template_id)
        .first()
    )
    if not db_template:
        raise HTTPException(
            status_code=404, detail="Survey template not found"
        )

    try:
        old_questions = (
            db.query(SurveyTemplateQuestion)
            .filter(SurveyTemplateQuestion.template_id == template_id)
            .all()
        )
        for old_q in old_questions:
            db.query(SurveyTemplateOption).filter(
                SurveyTemplateOption.question_id == old_q.id
            ).delete()

        db.query(SurveyTemplateQuestion).filter(
            SurveyTemplateQuestion.template_id == template_id
        ).delete()
        db.delete(db_template)
        db.commit()
        return {"message": "Survey template deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database execution failure: {str(e)}"
        )


@router.post("/modules/{module_id}/surveys/{survey_id}/clone-template")
def clone_existing_survey(
    module_id: int, survey_id: int, db: Session = Depends(get_db)
):
    module_exists = db.query(Module).filter(Module.id == module_id).first()

    if not module_exists:
        raise HTTPException(status_code=404, detail="Target module not found")

    source_survey = (
        db.query(SurveyForm)
        .options(
            joinedload(SurveyForm.questions).joinedload(SurveyQuestion.options)
        )
        .filter(SurveyForm.id == survey_id, SurveyForm.is_active == True)
        .first()
    )

    if not source_survey:
        raise HTTPException(status_code=404, detail="Source survey not found")

    try:
        new_survey = SurveyForm(
            module_id=module_id,
            title=source_survey.title,
            description=source_survey.description,
            is_active=True,
            is_reused=True,
        )

        db.add(new_survey)
        db.flush()

        for source_question in source_survey.questions:
            new_question = SurveyQuestion(
                survey_id=new_survey.id,
                question=source_question.question,
                question_type=source_question.question_type,
                is_required=source_question.is_required,
                question_order=source_question.question_order,
            )

            db.add(new_question)
            db.flush()

            for source_option in source_question.options:
                new_option = SurveyOption(
                    question_id=new_question.id,
                    option_text=source_option.option_text,
                    option_order=source_option.option_order,
                )

                db.add(new_option)

        db.commit()
        db.refresh(new_survey)

        return {"message": "Survey reused successfully", "survey_id": new_survey.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to reuse survey: {str(e)}"
        )


@router.post("/modules/{module_id}/use-template/{template_id}")
def use_survey_template_endpoint(
    module_id: int, template_id: int, db: Session = Depends(get_db)
):
    """Copies a clean standalone SurveyTemplate and creates a new Module SurveyForm live matrix map instance."""
    module_exists = db.query(Module).filter(Module.id == module_id).first()
    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    template_survey = (
        db.query(SurveyTemplate)
        .options(
            joinedload(SurveyTemplate.questions).joinedload(
                SurveyTemplateQuestion.options
            )
        )
        .filter(SurveyTemplate.id == template_id)
        .first()
    )
    if not template_survey:
        raise HTTPException(
            status_code=404,
            detail="Survey template blueprint framework structure not found",
        )

    try:
        new_survey = SurveyForm(
            module_id=module_id,
            title=template_survey.title,
            description=template_survey.description,
            is_active=True,
        )
        db.add(new_survey)
        db.flush()

        for tmpl_q in template_survey.questions:
            new_q = SurveyQuestion(
                survey_id=new_survey.id,
                question=tmpl_q.question,
                question_type=tmpl_q.question_type,
                is_required=tmpl_q.is_required,
                question_order=tmpl_q.question_order,
            )
            db.add(new_q)
            db.flush()

            if tmpl_q.options:
                for tmpl_opt in tmpl_q.options:
                    new_opt = SurveyOption(
                        question_id=new_q.id,
                        option_text=tmpl_opt.option_text,
                        option_order=tmpl_opt.option_order,
                    )
                    db.add(new_opt)

        db.commit()
        db.refresh(new_survey)
        return new_survey
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Relational deployment loop transformation failure: {str(e)}",
        )


def _calculate_candidate_attrition_data(db: Session):
    """Internal calculation helper shared between main analytics dashboard endpoint, CSV exports, and PDF generation."""
    responses = (
        db.query(SurveyResponse)
        .options(
            joinedload(SurveyResponse.answers).joinedload(
                SurveyAnswer.question
            )
        )
        .all()
    )

    flat_responses = []
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0

    score_map = {
        "Strongly Agree": 1.0,
        "Agree": 0.75,
        "Neutral": 0.50,
        "Disagree": 0.25,
        "Strongly Disagree": 0.0,
        "Yes": 1.0,
        "No": 0.0,
        "Always": 1.0,
        "Often": 0.75,
        "Sometimes": 0.50,
        "Rarely": 0.25,
        "Never": 0.0,
    }

    question_analysis = {}

    high_risk_keywords = {
        "resign",
        "leave",
        "leaving",
        "quit",
        "unhappy",
        "not satisfied",
        "poor",
        "bad",
        "stress",
        "stressed",
        "overworked",
    }
    medium_risk_keywords = {
        "maybe",
        "unsure",
        "neutral",
        "average",
        "sometimes",
        "concern",
        "concerned",
    }

    for r in responses:
        survey_form = (
            db.query(SurveyForm)
            .filter(SurveyForm.id == r.survey_id)
            .first()
            if r.survey_id
            else None
        )
        module_obj = (
            db.query(Module)
            .filter(Module.id == survey_form.module_id)
            .first()
            if (survey_form and survey_form.module_id)
            else None
        )
        program_obj = (
            db.query(Program)
            .filter(Program.id == module_obj.program_id)
            .first()
            if (module_obj and module_obj.program_id)
            else None
        )
        user_obj = (
            db.query(User)
            .filter(User.user_id == r.user_id)
            .first()
            if r.user_id
            else None
        )

        answers_list = []
        combined_text_lower = ""

        if r.answers:
            for ans in r.answers:
                q_id = ans.question_id
                q_text = (
                    ans.question.question
                    if (ans.question and hasattr(ans.question, "question"))
                    else None
                )
                q_type = (
                    ans.question.question_type
                    if (
                        ans.question
                        and hasattr(ans.question, "question_type")
                    )
                    else None
                )
                ans_text = (
                    str(ans.answer).strip() if ans.answer is not None else ""
                )

                score = score_map.get(ans_text)

                if score is not None:
                    if q_id not in question_analysis:
                        question_analysis[q_id] = {
                            "question": q_text,
                            "total_score": 0.0,
                            "count": 0,
                        }

                    question_analysis[q_id]["total_score"] += score
                    question_analysis[q_id]["count"] += 1

                combined_text_lower += " " + ans_text.lower()

                answers_list.append(
                    {
                        "question_id": q_id,
                        "question": q_text,
                        "question_type": q_type,
                        "answer": ans_text,
                    }
                )

        has_high = any(
            keyword in combined_text_lower for keyword in high_risk_keywords
        )
        has_medium = any(
            keyword in combined_text_lower for keyword in medium_risk_keywords
        )

        if has_high:
            risk_level = "High"
            risk_score = 8
            high_risk_count += 1
        elif has_medium:
            risk_level = "Medium"
            risk_score = 5
            medium_risk_count += 1
        else:
            risk_level = "Low"
            risk_score = 2
            low_risk_count += 1

        risk_score = min(10, max(0, risk_score))

        flat_responses.append(
            {
                "response_id": r.id,
                "survey_id": r.survey_id,
                "survey_title": survey_form.title if survey_form else None,
                "module_id": module_obj.id if module_obj else None,
                "module_title": module_obj.title if module_obj else None,
                "program_id": program_obj.id if program_obj else None,
                "program_name": program_obj.name if program_obj else None,
                "user_id": r.user_id,
                "employee_name": getattr(user_obj, "full_name", None)
                if user_obj
                else None,
                "employee_email": getattr(user_obj, "email", None)
                or getattr(user_obj, "employee_email", None)
                if user_obj
                else None,
                "submitted_at": r.submitted_at.isoformat()
                if r.submitted_at
                else None,
                "risk_level": risk_level,
                "risk_score": risk_score,
                "answers": answers_list,
            }
        )

    question_analysis_summary = []

    for q in question_analysis.values():
        average = (
            round(q["total_score"] / q["count"], 4) if q["count"] else 0.0
        )
        question_analysis_summary.append(
            {"question": q["question"], "average": average}
        )

    if question_analysis_summary:
        overall_score = round(
            (
                sum(item["average"] for item in question_analysis_summary)
                / len(question_analysis_summary)
            )
            * 10,
            2,
        )

        if overall_score <= 3:
            interpretation = "Very Poor"
        elif overall_score <= 5:
            interpretation = "Weak"
        elif overall_score <= 6:
            interpretation = "Moderate"
        elif overall_score <= 7:
            interpretation = "Effective"
        elif overall_score <= 8.5:
            interpretation = "Highly Effective"
        else:
            interpretation = "Completely Effective"

        highest_question = max(
            question_analysis_summary, key=lambda item: item["average"]
        )
        lowest_question = min(
            question_analysis_summary, key=lambda item: item["average"]
        )
    else:
        overall_score = 0.0
        interpretation = "Very Poor"
        highest_question = None
        lowest_question = None

    survey_effectiveness = {
        "overall_score": overall_score,
        "interpretation": interpretation,
        "highest_question": {
            "question": highest_question["question"],
            "average": highest_question["average"],
        }
        if highest_question
        else None,
        "lowest_question": {
            "question": lowest_question["question"],
            "average": lowest_question["average"],
        }
        if lowest_question
        else None,
        "questions": question_analysis_summary,
    }

    return {
        "total_responses": len(flat_responses),
        "high_risk": high_risk_count,
        "medium_risk": medium_risk_count,
        "low_risk": low_risk_count,
        "question_analysis": question_analysis_summary,
        "survey_effectiveness": survey_effectiveness,
        "responses": flat_responses,
    }


@router.get("/survey-analytics/candidate-attrition")
def get_candidate_attrition_analytics(db: Session = Depends(get_db)):
    """Fetches all SurveyResponses and calculates an algorithmic text attrition risk profile."""
    try:
        return _calculate_candidate_attrition_data(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch candidate attrition analytics: {str(e)}",
        )


@router.get("/survey-analytics/candidate-attrition/export/csv")
def export_candidate_attrition_csv(db: Session = Depends(get_db)):
    """Dynamically streams down a completely formatted metrics pipeline audit sheet."""
    try:
        analytics_data = _calculate_candidate_attrition_data(db)

        output = io.StringIO()
        writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)

        writer.writerow(
            [
                "Response ID",
                "Employee Name",
                "Employee Email",
                "Program",
                "Module",
                "Survey",
                "Risk Score",
                "Risk Level",
                "Submitted At",
            ]
        )

        for item in analytics_data["responses"]:
            writer.writerow(
                [
                    item["response_id"],
                    item["employee_name"] or "",
                    item["employee_email"] or "",
                    item["program_name"] or "",
                    item["module_title"] or "",
                    item["survey_title"] or "",
                    item["risk_score"],
                    item["risk_level"],
                    item["submitted_at"] or "",
                ]
            )

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=candidate_attrition_report.csv"
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build memory data stream for CSV download: {str(e)}",
        )


@router.get("/survey-analytics/candidate-attrition/export/pdf")
def export_candidate_attrition_pdf(db: Session = Depends(get_db)):
    """Generates a production safe landscape A4 structured compliance report."""
    try:
        analytics_data = _calculate_candidate_attrition_data(db)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30,
        )

        styles = getSampleStyleSheet()
        normal_style = styles["Normal"]
        title_style = styles["Heading1"]

        story = []

        story.append(Paragraph("<b>Candidate Attrition Report</b>", title_style))
        story.append(Spacer(1, 15))

        summary_text = (
            f"<b>Total Evaluated Submissions:</b> {analytics_data['total_responses']} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<b>High Risk Count:</b> {analytics_data['high_risk']} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<b>Medium Risk Count:</b> {analytics_data['medium_risk']} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<b>Low Risk Count:</b> {analytics_data['low_risk']}"
        )
        story.append(Paragraph(summary_text, normal_style))
        story.append(Spacer(1, 20))

        table_data = [
            [
                Paragraph("<b>Employee Name</b>", normal_style),
                Paragraph("<b>Email</b>", normal_style),
                Paragraph("<b>Program</b>", normal_style),
                Paragraph("<b>Module</b>", normal_style),
                Paragraph("<b>Survey</b>", normal_style),
                Paragraph("<b>Risk Score</b>", normal_style),
                Paragraph("<b>Risk Level</b>", normal_style),
                Paragraph("<b>Submitted At</b>", normal_style),
            ]
        ]

        for item in analytics_data["responses"]:
            table_data.append(
                [
                    Paragraph(item["employee_name"] or "N/A", normal_style),
                    Paragraph(item["employee_email"] or "N/A", normal_style),
                    Paragraph(item["program_name"] or "N/A", normal_style),
                    Paragraph(item["module_title"] or "N/A", normal_style),
                    Paragraph(item["survey_title"] or "N/A", normal_style),
                    Paragraph(str(item["risk_score"]), normal_style),
                    Paragraph(item["risk_level"], normal_style),
                    Paragraph(
                        (item["submitted_at"][:10])
                        if item["submitted_at"]
                        else "N/A",
                        normal_style,
                    ),
                ]
            )

        col_widths = [100, 115, 110, 110, 110, 60, 65, 75]

        report_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        report_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#F2F4F7"),
                    ),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#F9FAFB")],
                    ),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#EAECF0")),
                ]
            )
        )

        story.append(report_table)
        doc.build(story)

        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=candidate_attrition_report.pdf"
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile PDF transaction streams: {str(e)}",
        )

@router.get("/application-check-automation")
def get_application_check_automation(
    db: Session = Depends(get_db),
):
    setting = (
        db.query(ApplicationCheckAutomationSetting)
        .first()
    )

    if not setting:
        setting = ApplicationCheckAutomationSetting(
            is_enabled=False
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return {
        "is_enabled": setting.is_enabled
    }


class ApplicationCheckAutomationRequest(BaseModel):
    is_enabled: bool


@router.put("/application-check-automation")
def update_application_check_automation(
    payload: ApplicationCheckAutomationRequest,
    db: Session = Depends(get_db),
):
    setting = (
        db.query(ApplicationCheckAutomationSetting)
        .first()
    )

    if not setting:
        setting = ApplicationCheckAutomationSetting(
            is_enabled=payload.is_enabled
        )
        db.add(setting)
    else:
        setting.is_enabled = payload.is_enabled

    db.commit()
    db.refresh(setting)

    return {
        "message": (
            "Application Check automation enabled"
            if setting.is_enabled
            else "Application Check automation disabled"
        ),
        "is_enabled": setting.is_enabled,
    }

    
class ApplicationCheckReviewRequest(BaseModel):
    status: str
    review_comment: Optional[str] = None


@router.get("/application-check-submissions")
def get_application_check_submissions(db: Session = Depends(get_db)):
    try:
        attempts = (
            db.query(ApplicationCheckAttempt)
            .options(
                joinedload(ApplicationCheckAttempt.application_check)
                .joinedload(ApplicationCheck.program)
            )
            .all()
        )

        results = []
        for attempt in attempts:
            app_check = attempt.application_check
            program = app_check.program if app_check else None
            user = db.query(User).filter(User.user_id == attempt.user_id).first()

            progress = (
                db.query(UserApplicationCheckProgress)
                .filter(
                    UserApplicationCheckProgress.user_id == attempt.user_id,
                    UserApplicationCheckProgress.application_check_id == attempt.application_check_id,
                )
                .first()
            )

            results.append(
                {
                    "attempt_id": attempt.id,
                    "user_id": attempt.user_id,
                    "employee_name": user.full_name if user else "Unknown",
                    "employee_email": user.email if user else None,
                    "program_id": program.id if program else None,
                    "program_name": program.name if program else None,
                    "application_check_id": attempt.application_check_id,
                    "check_number": app_check.check_number if app_check else None,
                    "unlock_after_days": app_check.unlock_after_days if app_check else None,
                    "score": attempt.score,
                    "total_questions": attempt.total_questions,
                    "percentage": attempt.percentage,
                    "passed": attempt.passed,
                    "attempted_at": attempt.attempted_at.isoformat() if attempt.attempted_at else None,
                    "status": progress.status if progress else "Pending",
                    "reviewed_at": progress.reviewed_at.isoformat() if progress and progress.reviewed_at else None,
                    "reviewed_by": progress.reviewed_by if progress else None,
                    "review_comment": progress.review_comment if progress else None,
                }
            )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch submissions: {str(e)}")


@router.get("/application-check-submissions/{attempt_id}")
def get_application_check_submission_detail(attempt_id: int, db: Session = Depends(get_db)):
    attempt = (
        db.query(ApplicationCheckAttempt)
        .options(
            joinedload(ApplicationCheckAttempt.application_check)
            .joinedload(ApplicationCheck.questions),
            joinedload(ApplicationCheckAttempt.application_check)
            .joinedload(ApplicationCheck.program),
        )
        .filter(ApplicationCheckAttempt.id == attempt_id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Application check submission not found")

    app_check = attempt.application_check
    program = app_check.program if app_check else None
    user = db.query(User).filter(User.user_id == attempt.user_id).first()
    progress = (
        db.query(UserApplicationCheckProgress)
        .filter(
            UserApplicationCheckProgress.user_id == attempt.user_id,
            UserApplicationCheckProgress.application_check_id == attempt.application_check_id,
        )
        .first()
    )

    return {
        "attempt_id": attempt.id,
        "user_id": attempt.user_id,
        "candidate_name": user.full_name if user else "Unknown User",
        "candidate_email": user.email if user else None,
        "program_id": program.id if program else None,
        "program_name": program.name if program else None,
        "application_check_id": attempt.application_check_id,
        "check_number": app_check.check_number if app_check else None,
        "unlock_after_days": app_check.unlock_after_days if app_check else None,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "percentage": attempt.percentage,
        "passed": attempt.passed,
        "submitted_at": attempt.attempted_at.isoformat() if attempt.attempted_at else None,
        "answers": attempt.answers,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "display_order": q.display_order,
            }
            for q in (app_check.questions if app_check else [])
        ],
        "status": progress.status if progress else "Pending",
        "reviewed_at": progress.reviewed_at.isoformat() if progress and progress.reviewed_at else None,
        "reviewed_by": progress.reviewed_by if progress else None,
        "review_comment": progress.review_comment if progress else None,
    }


@router.put("/application-check-submissions/{attempt_id}/review")
def review_application_check_submission(
    attempt_id: int,
    payload: ApplicationCheckReviewRequest,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
):
    if payload.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'Approved' or 'Rejected'.")

    setting = db.query(ApplicationCheckAutomationSetting).first()

    if setting and setting.is_enabled:
        raise HTTPException(
            status_code=400,
            detail="Application Checks are currently automated. Manual review is disabled."
        )
    
    attempt = (
        db.query(ApplicationCheckAttempt)
        .options(
            joinedload(ApplicationCheckAttempt.application_check)
            .joinedload(ApplicationCheck.program)
        )
        .filter(ApplicationCheckAttempt.id == attempt_id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Application check submission not found")

    app_check = attempt.application_check
    program = app_check.program if app_check else None

    try:
        progress = (
            db.query(UserApplicationCheckProgress)
            .filter(
                UserApplicationCheckProgress.user_id == attempt.user_id,
                UserApplicationCheckProgress.application_check_id == attempt.application_check_id,
            )
            .first()
        )

        if not progress:
            progress = UserApplicationCheckProgress(
                user_id=attempt.user_id,
                program_id=program.id if program else app_check.program_id,
                application_check_id=attempt.application_check_id,
            )
            db.add(progress)

        progress.status = payload.status
        progress.reviewed_at = datetime.utcnow()
        progress.review_comment = payload.review_comment
        if actor_id is not None:
            progress.reviewed_by = actor_id

        program_name = program.name if program else "Program"

        if payload.status == "Approved":
            notification_title = "Application Check Approved"
            msg_text = (
                f"Your Application Check {app_check.check_number} "
                f"for {program_name} has been approved."
            )
        else:
            notification_title = "Application Check Rejected"

            msg_text = (
                f"Your Application Check {app_check.check_number} "
                f"for {program_name} has been rejected. "
                f"Please reattempt the Application Check."
        )

            if payload.review_comment and payload.review_comment.strip():
                msg_text += (
                    f" Review comment: {payload.review_comment.strip()}"
                )

        notification = UserNotification(
            user_id=attempt.user_id,
            program_id=program.id if program else app_check.program_id,
            application_check_id=app_check.id,
            title=notification_title,
            message=msg_text,
        )

        db.add(notification)

        user = (
            db.query(User)
            .filter(User.user_id == attempt.user_id)
            .first()
        )

        if user and user.email:
            try:
                send_notification_email(
                    to_email=user.email,
                    title=notification.title,
                    message=notification.message,
                )

                print(
                    f"Application Check email sent to {user.email}"
                )

            except Exception as e:
                print(
                    f"Failed to send Application Check email "
                    f"to {user.email}: {e}"
                )

        db.commit()
        db.refresh(progress)

        return {"message": f"Application check submission {payload.status.lower()} successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to review submission: {str(e)}")


@router.get("/{program_id}")
def get_program(program_id: int, db: Session = Depends(get_db)):
    """Eagerly loads a complete program hierarchy map with child arrays nested inside."""
    program = (
        db.query(Program)
        .options(
            joinedload(Program.modules)
            .joinedload(Module.videos)
            .joinedload(Video.documents),
            joinedload(Program.modules)
            .joinedload(Module.quizzes)
            .joinedload(Quiz.questions),
            joinedload(Program.modules).joinedload(Module.written_lessons),
            joinedload(Program.modules)
            .joinedload(Module.survey_forms)
            .joinedload(SurveyForm.questions)
            .joinedload(SurveyQuestion.options),
            joinedload(Program.modules).joinedload(Module.assignments),
        )
        .filter(Program.id == program_id)
        .first()
    )

    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    return {
        "id": program.id,
        "name": program.name,
        "description": program.description,
        "status": program.status,
        "modules": [
            {
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "module_order": m.module_order,
                "videos": [
                    {
                        "id": v.id,
                        "title": v.title,
                        "subtitle": v.subtitle,
                        "youtube_url": v.youtube_url,
                        "description": v.description,
                        "explanation_text": v.explanation_text,
                        "thumbnail_url": v.thumbnail_url,
                        "content_order": v.content_order,
                        "documents": [
                            {
                                "id": doc.id,
                                "title": doc.title,
                                "description": doc.description,
                                "file_url": doc.file_url,
                            }
                            for doc in v.documents
                        ],
                    }
                    for v in sorted(
                        [video for video in m.videos],
                        key=lambda item: item.content_order or 0,
                    )
                ],
                "quizzes": [
                    {
                        "id": q.id,
                        "title": q.title,
                        "description": q.description,
                        "type": q.quiz_type,
                        "passing_percentage": q.passing_percentage,
                        "content_order": q.content_order,
                        "questions": [
                            {
                                "id": question.id,
                                "question": question.question,
                                "options": question.options,
                                "explanation": question.explanation,
                                "marks": question.marks,
                                "question_order": question.question_order,
                            }
                            for question in sorted(
                                q.questions,
                                key=lambda item: item.question_order or 0,
                            )
                        ],
                    }
                    for q in sorted(
                        m.quizzes, key=lambda item: item.content_order or 0
                    )
                ],
                "written_lessons": [
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "content": lesson.content,
                        "pdf_url": lesson.pdf_url,
                        "is_active": lesson.is_active,
                        "content_order": lesson.content_order,
                        "created_at": lesson.created_at,
                    }
                    for lesson in sorted(
                        m.written_lessons,
                        key=lambda item: item.content_order or 0,
                    )
                ],
                "assignments": [
                    {
                        "assignment_id": a.assignment_id,
                        "title": a.title,
                        "description": a.description,
                        "instructions": a.instructions,
                        "deadline": a.deadline,
                        "max_marks": a.max_marks,
                        "passing_marks": a.passing_marks,
                        "submission_type": a.submission_type,
                        "status": a.status,
                    }
                    for a in m.assignments
                ],
                "surveys": [
                    {
                        "id": s.id,
                        "title": s.title,
                        "description": s.description,
                        "is_active": s.is_active,
                        "content_order": s.content_order,
                        "created_at": getattr(s, "created_at", None),
                        "updated_at": getattr(s, "updated_at", None),
                        "questions": [
                            {
                                "id": q.id,
                                "survey_id": q.survey_id,
                                "question": q.question,
                                "question_type": q.question_type,
                                "is_required": q.is_required,
                                "question_order": getattr(
                                    q, "question_order", None
                                ),
                                "options": [
                                    {
                                        "id": opt.id,
                                        "option_text": opt.option_text,
                                        "option_order": opt.option_order,
                                    }
                                    for opt in q.options
                                ],
                            }
                            for q in s.questions
                        ],
                    }
                    for s in sorted(
                        [
                            survey
                            for survey in m.survey_forms
                            if survey.is_active
                        ],
                        key=lambda item: item.content_order or 0,
                    )
                ],
                "curos": m.curos or 0,
            }
            for m in sorted(
                program.modules, key=lambda module: module.module_order or 0
            )
        ],
        "curos": program.curos or 0,
        "total_module_curos": sum(m.curos or 0 for m in program.modules),
    }


class ModuleOrderItem(BaseModel):
    id: int
    module_order: int


class ModuleReorderRequest(BaseModel):
    modules: List[ModuleOrderItem]


class ContentOrderItem(BaseModel):
    id: int
    type: str
    content_order: int


class ContentReorderRequest(BaseModel):
    items: List[ContentOrderItem]


class VideoUpdateRequest(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    youtube_url: str | None = None
    description: str | None = None
    explanation_text: str | None = None
    thumbnail_url: str | None = None


class QuizUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    quiz_type: str | None = None
    unlock_type: str | None = None
    passing_percentage: int | None = None
    result_template: int | None = None


class QuizAnswerInput(BaseModel):
    question_id: int
    selected_option: int


class QuizSubmitRequest(BaseModel):
    user_id: int
    answers: List[QuizAnswerInput]


class SurveyAnswerInput(BaseModel):
    question_id: int
    answer: str


class SurveySubmitRequest(BaseModel):
    user_id: int
    answers: List[SurveyAnswerInput]


class SurveyReuseRequest(BaseModel):
    module_id: int
    template_id: int


@router.put("/{program_id}/modules/reorder")
def reorder_program_modules(
    program_id: int,
    payload: ModuleReorderRequest,
    db: Session = Depends(get_db),
):
    program = db.query(Program).filter(Program.id == program_id).first()

    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    try:
        for item in payload.modules:
            module = (
                db.query(Module)
                .filter(
                    Module.id == item.id, Module.program_id == program_id
                )
                .first()
            )

            if module:
                module.module_order = item.module_order

        db.commit()

        return {"message": "Module order updated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to reorder modules: {str(e)}"
        )


@router.put("/modules/{module_id}/content/reorder")
def reorder_module_content(
    module_id: int, payload: ContentReorderRequest, db: Session = Depends(get_db)
):
    module = db.query(Module).filter(Module.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    model_map = {
        "video": Video,
        "written": WrittenLesson,
        "quiz": Quiz,
        "survey": SurveyForm,
    }

    try:
        for item in payload.items:
            model = model_map.get(item.type)

            if not model:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid content type: {item.type}",
                )

            content = (
                db.query(model)
                .filter(model.id == item.id, model.module_id == module_id)
                .first()
            )

            if content:
                content.content_order = item.content_order

        db.commit()

        return {"message": "Module content order updated successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to reorder module content: {str(e)}"
        )


@router.post("/{program_id}/modules/")
def create_program_module(
    program_id: int,
    title: str,
    http_request: Request,
    db: Session = Depends(get_db),
    description: str | None = None,
    curos: int = 0,
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None),
):
    program_exists = db.query(Program).filter(Program.id == program_id).first()
    if not program_exists:
        raise HTTPException(status_code=404, detail="Target Program not found")

    last_module = (
        db.query(Module)
        .filter(Module.program_id == program_id)
        .order_by(Module.module_order.desc())
        .first()
    )
    next_order = 1
    if last_module and last_module.module_order is not None:
        next_order = last_module.module_order + 1

    new_module = Module(
        program_id=program_id,
        title=title,
        description=description,
        module_order=next_order,
        is_active=True,

        curos=curos
    )

    try:
        db.add(new_module)
        db.commit()
        db.refresh(new_module)

        create_audit_log(
            db=db,
            request=http_request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="module_created",
            entity_type="module",
            entity_id=new_module.id,
            message=f"Created module: {new_module.title} in program {program_id}",
            metadata={
                "module_id": new_module.id,
                "program_id": program_id,
                "title": new_module.title,
                "description": new_module.description,
            },
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database write error for module: {str(e)}"
        )

    return new_module


@router.get("/{program_id}/modules/")
def get_program_modules(program_id: int, db: Session = Depends(get_db)):
    program_exists = db.query(Program).filter(Program.id == program_id).first()
    if not program_exists:
        raise HTTPException(status_code=404, detail="Target Program not found")

    return db.query(Module).filter(Module.program_id == program_id).all()


@router.put("/modules/{module_id}")
def update_program_module(
    module_id: int,
    payload: ModuleUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None),
):
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")

    old_values = {
        "title": db_module.title,
        "description": db_module.description,
        "is_active": db_module.is_active,
        "curos": db_module.curos,

    }

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_module, key, value)

    try:
        db.commit()
        db.refresh(db_module)

        create_audit_log(
            db=db,
            request=http_request,
            actor_id=actor_id,
            actor_name=actor_name,
            action="module_updated",
            entity_type="module",
            entity_id=module_id,
            message=f"Updated module: {db_module.title}",
            metadata={
                "module_id": module_id,
                "old_values": old_values,
                "changes": update_data,
            },
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database update error for module: {str(e)}",
        )

    return db_module


@router.delete("/modules/{module_id}")
def delete_module(
    module_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    actor_id: Optional[int] = Query(None),
    actor_name: Optional[str] = Query(None),
):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    module_details = {
        "module_id": module.id,
        "program_id": module.program_id,
        "title": module.title,
        "description": module.description,
    }

    db.delete(module)
    db.commit()

    create_audit_log(
        db=db,
        request=http_request,
        actor_id=actor_id,
        actor_name=actor_name,
        action="module_deleted",
        entity_type="module",
        entity_id=module_id,
        message=f"Deleted module: {module_details['title']}",
        metadata=module_details,
    )

    return {"message": "Module deleted successfully"}


@router.post("/modules/{module_id}/videos/")
def create_module_video(
    module_id: int, payload: VideoCreateSchema, db: Session = Depends(get_db)
):
    module_exists = (
        db.query(Module)
        .filter(Module.id == module_id)
        .first()
    )
    if not module_exists:
        raise HTTPException(
            status_code=404,
            detail="Target Module not found",
        )

    db_video = Video(
        module_id=module_id,
        title=payload.title,
        subtitle=payload.subtitle,
        youtube_url=payload.youtube_url,
        description=payload.description,
        explanation_text=payload.explanation_text,
        thumbnail_url=payload.thumbnail_url,
    )

    try:
        db.add(db_video)
        db.commit()
        db.refresh(db_video)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database write error for video: {str(e)}"
        )

    return {
        "status": "success",
        "message": "Video lesson saved successfully",
        "video": {
            "id": db_video.id,
            "module_id": db_video.module_id,
            "title": db_video.title,
            "subtitle": db_video.subtitle,
            "youtube_url": db_video.youtube_url,
            "description": db_video.description,
            "explanation_text": db_video.explanation_text,
            "thumbnail_url": db_video.thumbnail_url,
        },
    }


@router.get("/modules/{module_id}/videos/")
def get_module_videos(module_id: int, db: Session = Depends(get_db)):
    module_exists = db.query(Module).filter(Module.id == module_id).first()
    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    return db.query(Video).filter(Video.module_id == module_id).all()


@router.put("/videos/{video_id}")
def update_video(
    video_id: int, payload: VideoUpdateRequest, db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video lesson not found")

    try:
        update_data = payload.dict(exclude_unset=True)

        for key, value in update_data.items():
            setattr(video, key, value)

        db.commit()
        db.refresh(video)

        return {"message": "Video lesson updated successfully", "video": video}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to update video: {str(e)}"
        )


@router.delete("/videos/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video lesson not found")

    try:
        video.is_active = False
        db.commit()

        return {"message": "Video lesson deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to delete video: {str(e)}"
        )


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only PDF files are accepted.",
        )

    max_size = 20 * 1024 * 1024
    try:
        file_contents = await file.read()
        if len(file_contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds the 20 MB allowance limit.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading file properties: {str(e)}"
        )

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    storage_path = f"documents/{unique_filename}"

    try:
        bucket_name = "learning-assets"
        supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_contents,
            file_options={"content-type": "application/pdf"},
        )
        public_url = supabase.storage.from_(bucket_name).get_public_url(
            storage_path
        )
        return {"message": "Upload successful", "file_url": public_url}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase storage pipeline failure: {str(e)}",
        )


@router.post("/upload-thumbnail")
async def upload_thumbnail(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only image files are accepted.",
        )

    max_size = 5 * 1024 * 1024
    try:
        file_contents = await file.read()
        if len(file_contents) > max_size:
            raise HTTPException(
                status_code=400,
                detail="Thumbnail size exceeds the 5 MB limit.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading thumbnail: {str(e)}"
        )

    extension = os.path.splitext(file.filename or "")[1].lower()
    storage_path = f"program-thumbnails/{uuid.uuid4()}{extension}"

    try:
        bucket_name = "learning-assets"
        supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_contents,
            file_options={"content-type": file.content_type},
        )
        public_url = supabase.storage.from_(bucket_name).get_public_url(
            storage_path
        )
        return {"message": "Thumbnail upload successful", "file_url": public_url}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Supabase storage pipeline failure: {str(e)}",
        )


@router.post("/videos/{video_id}/documents")
def create_video_document(
    video_id: int, payload: VideoDocumentCreate, db: Session = Depends(get_db)
):
    video_exists = db.query(Video).filter(Video.id == video_id).first()
    if not video_exists:
        raise HTTPException(status_code=404, detail="Target Video not found")

    if not payload.file_url.strip():
        raise HTTPException(status_code=400, detail="File URL is required")

    db_document = VideoDocument(
        video_id=video_id,
        title=payload.title,
        description=payload.description,
        file_url=payload.file_url,
    )

    try:
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database write error for document: {str(e)}",
        )

    return db_document


@router.get("/videos/{video_id}/documents")
def get_video_documents(video_id: int, db: Session = Depends(get_db)):
    video_exists = db.query(Video).filter(Video.id == video_id).first()
    if not video_exists:
        raise HTTPException(status_code=404, detail="Target Video not found")

    return (
        db.query(VideoDocument)
        .filter(VideoDocument.video_id == video_id)
        .all()
    )


@router.post("/modules/{module_id}/quizzes/")
def create_module_quiz(
    module_id: int,
    title: str,
    passing_percentage: int,
    description: str | None = None,
    quiz_type: str = "MCQ",
    unlock_type: str = "Immediate",
    result_template: int = 1,
    db: Session = Depends(get_db),
):
    module_exists = db.query(Module).filter(Module.id == module_id).first()

    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    if not title or not title.strip():
        raise HTTPException(
            status_code=400,
            detail="Quiz title is required",
        )

    if passing_percentage < 1 or passing_percentage > 100:
        raise HTTPException(
            status_code=400,
            detail="Passing percentage must be between 1 and 100",
        )

    new_quiz = Quiz(
        module_id=module_id,
        title=title,
        description=description,
        quiz_type=quiz_type,
        unlock_type=unlock_type,
        passing_percentage=passing_percentage,
        result_template=result_template,
    )

    try:
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)

        return new_quiz

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create quiz: {str(e)}"
        )


@router.post("/quizzes/{quiz_id}/questions/")
def bulk_insert_quiz_questions(
    quiz_id: int, payload: BulkQuestionsInput, db: Session = Depends(get_db)
):
    quiz_exists = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz_exists:
        raise HTTPException(
            status_code=404, detail="Target Quiz structure not found"
        )

    inserted_records = []

    for index, q_item in enumerate(payload.questions):
        if q_item.marks <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Marks for question {index + 1} must be greater than 0",
            )

        db_question = QuizQuestion(
            quiz_id=quiz_id,
            question=q_item.question,
            options=[opt.dict() for opt in q_item.options],
            explanation=q_item.explanation,
            marks=q_item.marks,
            question_order=index + 1,
        )

        db.add(db_question)
        inserted_records.append(db_question)

    try:
        db.commit()

        for record in inserted_records:
            db.refresh(record)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database persistent write error: {str(e)}",
        )

    return {"status": "success", "inserted_count": len(inserted_records)}


@router.get("/quizzes/{quiz_id}/questions/")
def get_quiz_questions(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=404, detail="Quiz framework structure not found"
        )

    return quiz.questions


@router.put("/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: int, payload: QuizUpdateRequest, db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    try:
        update_data = payload.dict(exclude_unset=True)

        for key, value in update_data.items():
            setattr(quiz, key, value)

        db.commit()
        db.refresh(quiz)

        return {"message": "Quiz updated successfully", "quiz": quiz}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to update quiz: {str(e)}"
        )


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    try:
        db.delete(quiz)
        db.commit()

        return {"message": "Quiz deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to delete quiz: {str(e)}"
        )


@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int, payload: QuizSubmitRequest, db: Session = Depends(get_db)
):
    quiz = (
        db.query(Quiz)
        .options(joinedload(Quiz.questions))
        .filter(Quiz.id == quiz_id)
        .first()
    )

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    user = db.query(User).filter(User.user_id == payload.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not quiz.questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    try:
        question_map = {question.id: question for question in quiz.questions}

        earned_marks = 0
        total_marks = sum(question.marks or 0 for question in quiz.questions)

        submitted_answers = []
        answered_question_ids = set()

        for answer_item in payload.answers:
            if answer_item.question_id in answered_question_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question {answer_item.question_id} was answered more than once",
                )

            answered_question_ids.add(answer_item.question_id)
            question = question_map.get(answer_item.question_id)

            if not question:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question {answer_item.question_id} does not belong to this quiz",
                )

            options = question.options or []

            if (
                answer_item.selected_option < 0
                or answer_item.selected_option >= len(options)
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid selected option for question {question.id}",
                )

            selected_option = options[answer_item.selected_option]
            is_correct = bool(selected_option.get("isCorrect", False))
            marks_earned = question.marks if is_correct else 0

            earned_marks += marks_earned

            submitted_answers.append(
                {
                    "question_id": question.id,
                    "selected_option": answer_item.selected_option,
                    "is_correct": is_correct,
                    "marks_earned": marks_earned,
                }
            )

        if total_marks <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quiz total marks must be greater than 0",
            )

        percentage = round((earned_marks / total_marks) * 100, 2)
        passed = percentage >= quiz.passing_percentage

        previous_attempts = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == payload.user_id,
                QuizAttempt.quiz_id == quiz_id,
            )
            .count()
        )

        attempt_number = previous_attempts + 1
        quiz_attempt = QuizAttempt(
            user_id=payload.user_id,
            quiz_id=quiz_id,
            score=earned_marks,
            total_marks=total_marks,
            total_questions=len(quiz.questions),
            percentage=percentage,
            passed=passed,
            attempt_number=attempt_number,
            answers=submitted_answers,
            attempted_at=datetime.utcnow(),
        )

        db.add(quiz_attempt)
        db.flush()

        for answer in submitted_answers:
            attempt_answer = QuizAttemptAnswer(
                attempt_id=quiz_attempt.id,
                question_id=answer["question_id"],
                selected_option=answer["selected_option"],
                is_correct=answer["is_correct"],
                marks_earned=answer["marks_earned"],
            )

            db.add(attempt_answer)

        db.flush()
        db.commit()
        db.refresh(quiz_attempt)

        return {
            "message": "Quiz submitted successfully",
            "attempt_id": quiz_attempt.id,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "score": earned_marks,
            "total_marks": total_marks,
            "percentage": percentage,
            "passing_percentage": quiz.passing_percentage,
            "passed": passed,
            "attempt_number": attempt_number,
        }
    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to submit quiz: {str(e)}"
        )


@router.get("/quizzes/{quiz_id}/results")
def get_quiz_results(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz_id)
        .order_by(QuizAttempt.id.desc())
        .all()
    )

    results = []

    for attempt in attempts:
        user = db.query(User).filter(User.user_id == attempt.user_id).first()

        results.append(
            {
                "attempt_id": attempt.id,
                "user_id": attempt.user_id,
                "candidate_name": user.full_name if user else "Unknown User",
                "candidate_email": user.email if user else None,
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "score": attempt.score,
                "total_marks": attempt.total_marks,
                "percentage": attempt.percentage,
                "passing_percentage": quiz.passing_percentage,
                "passed": attempt.passed,
                "attempt_number": attempt.attempt_number,
            }
        )

    return {
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "passing_percentage": quiz.passing_percentage,
        "total_results": len(results),
        "results": results,
    }


@router.get("/quiz-attempts/{attempt_id}/result")
def get_quiz_attempt_result(attempt_id: int, db: Session = Depends(get_db)):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()

    user = db.query(User).filter(User.user_id == attempt.user_id).first()

    return {
        "attempt_id": attempt.id,
        "user_id": attempt.user_id,
        "candidate_name": user.full_name if user else "Unknown User",
        "candidate_email": user.email if user else None,
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "score": attempt.score,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "passing_percentage": quiz.passing_percentage,
        "passed": attempt.passed,
        "attempt_number": attempt.attempt_number,
    }


@router.post("/modules/{module_id}/written-lessons")
def create_module_written_lesson(
    module_id: int, payload: WrittenLessonCreate, db: Session = Depends(get_db)
):
    module_exists = db.query(Module).filter(Module.id == module_id).first()
    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    if not payload.title.strip() or not payload.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Lesson title and content are required",
        )

    db_lesson = WrittenLesson(
        module_id=module_id,
        title=payload.title,
        content=payload.content,
        pdf_url=payload.pdf_url,
        is_active=True,
    )

    try:
        db.add(db_lesson)
        db.commit()
        db.refresh(db_lesson)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database write error for written lesson: {str(e)}",
        )

    return db_lesson


@router.get("/modules/{module_id}/written-lessons")
def get_module_written_lessons(
    module_id: int, db: Session = Depends(get_db)
):
    module_exists = db.query(Module).filter(Module.id == module_id).first()
    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    return (
        db.query(WrittenLesson)
        .filter(
            WrittenLesson.module_id == module_id,
            WrittenLesson.is_active == True,
        )
        .all()
    )


@router.put("/written-lessons/{lesson_id}")
def update_written_lesson(
    lesson_id: int, payload: WrittenLessonUpdate, db: Session = Depends(get_db)
):
    db_lesson = (
        db.query(WrittenLesson).filter(WrittenLesson.id == lesson_id).first()
    )
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Written lesson not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lesson, key, value)

    try:
        db.commit()
        db.refresh(db_lesson)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database update error for written lesson: {str(e)}",
        )

    return db_lesson


@router.delete("/written-lessons/{lesson_id}")
def delete_written_lesson(lesson_id: int, db: Session = Depends(get_db)):
    db_lesson = (
        db.query(WrittenLesson).filter(WrittenLesson.id == lesson_id).first()
    )
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Written lesson not found")

    try:
        db_lesson.is_active = False
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database delete error for written lesson: {str(e)}",
        )

    return {"message": "Written lesson deleted successfully"}


@router.post("/modules/{module_id}/assignments")
def create_assignment(
    module_id: int, payload: AssignmentCreate, db: Session = Depends(get_db)
):
    module = db.query(Module).filter(Module.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    assignment = Assignment(
        module_id=module_id,
        title=payload.title,
        description=payload.description,
        instructions=payload.instructions,
        deadline=payload.deadline,
        max_marks=payload.max_marks,
        passing_marks=payload.passing_marks,
        submission_type=payload.submission_type,
        allow_multiple_files=payload.allow_multiple_files,
        allow_late_submission=payload.allow_late_submission,
        late_penalty=payload.late_penalty,
        max_file_size=payload.max_file_size,
    )

    try:
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        return assignment

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modules/{module_id}/assignments")
def get_module_assignments(module_id: int, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return (
        db.query(Assignment).filter(Assignment.module_id == module_id).all()
    )


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = (
        db.query(Assignment)
        .filter(Assignment.assignment_id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()

    return {"message": "Assignment deleted successfully"}


@router.put("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(Assignment)
        .filter(Assignment.assignment_id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(assignment, key, value)

    try:
        db.commit()
        db.refresh(assignment)

        return assignment

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/modules/{module_id}/surveys")
def create_module_survey(
    module_id: int, payload: SurveyFormCreate, db: Session = Depends(get_db)
):
    """Creates a baseline live SurveyForm instance nested directly inside a module."""
    module_exists = db.query(Module).filter(Module.id == module_id).first()
    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    new_survey = SurveyForm(
        module_id=module_id,
        title=payload.title,
        description=payload.description,
        is_active=True,
    )

    try:
        db.add(new_survey)
        db.commit()
        db.refresh(new_survey)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database write error for survey: {str(e)}",
        )

    return new_survey


@router.get("/modules/{module_id}/surveys")
def get_module_surveys(module_id: int, db: Session = Depends(get_db)):
    """Fetches live active survey instances belonging to a targeted module."""
    module_exists = db.query(Module).filter(Module.id == module_id).first()
    if not module_exists:
        raise HTTPException(status_code=404, detail="Target Module not found")

    return (
        db.query(SurveyForm)
        .filter(
            SurveyForm.module_id == module_id, SurveyForm.is_active == True
        )
        .all()
    )


@router.get("/surveys/templates")
def get_all_survey_templates(db: Session = Depends(get_db)):
    """Fetches global template files maps structures sorted newest elements first."""
    return (
        db.query(SurveyForm)
        .filter(SurveyForm.is_template == True, SurveyForm.is_active == True)
        .order_by(SurveyForm.created_at.desc())
        .all()
    )


@router.get("/surveys/history")
def get_survey_history_log(db: Session = Depends(get_db)):
    """Provides standard descending historic database sequence query execution streams."""
    return db.query(SurveyForm).order_by(SurveyForm.created_at.desc()).all()


@router.get("/surveys/{survey_id}")
def get_single_survey(survey_id: int, db: Session = Depends(get_db)):
    """Fetches a standalone active live survey form containing its question matrix map."""
    survey = (
        db.query(SurveyForm)
        .options(
            joinedload(SurveyForm.questions).joinedload(SurveyQuestion.options)
        )
        .filter(SurveyForm.id == survey_id, SurveyForm.is_active == True)
        .first()
    )
    if not survey:
        raise HTTPException(
            status_code=404, detail="Survey form structure not found"
        )
    return survey


@router.post("/surveys/{survey_id}/submit")
def submit_survey(
    survey_id: int, payload: SurveySubmitRequest, db: Session = Depends(get_db)
):
    try:
        survey = (
            db.query(SurveyForm)
            .filter(SurveyForm.id == survey_id, SurveyForm.is_active == True)
            .first()
        )
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        user = db.query(User).filter(User.user_id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        existing_response = (
            db.query(SurveyResponse)
            .filter(
                SurveyResponse.survey_id == survey_id,
                SurveyResponse.user_id == payload.user_id,
            )
            .first()
        )
        if existing_response:
            raise HTTPException(
                status_code=400,
                detail="You have already submitted this survey",
            )

        survey_question_ids = {
            q.id
            for q in db.query(SurveyQuestion.id)
            .filter(SurveyQuestion.survey_id == survey_id)
            .all()
        }

        new_response = SurveyResponse(
            survey_id=survey_id,
            user_id=payload.user_id,
            submitted_at=datetime.utcnow(),
        )
        db.add(new_response)
        db.flush()

        for answer_item in payload.answers:
            if answer_item.question_id not in survey_question_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question {answer_item.question_id} does not belong to this survey",
                )

            new_answer = SurveyAnswer(
                response_id=new_response.id,
                question_id=answer_item.question_id,
                answer=answer_item.answer,
            )
            db.add(new_answer)

        survey_completion = (
            db.query(SurveyCompletion)
            .filter(
                SurveyCompletion.user_id == payload.user_id,
                SurveyCompletion.survey_id == survey_id,
            )
            .first()
        )

        if not survey_completion:
            survey_completion = SurveyCompletion(
                user_id=payload.user_id,
                survey_id=survey_id,
                is_completed=False,
            )
            db.add(survey_completion)

        survey_completion.is_completed = True
        survey_completion.completed_at = datetime.utcnow()

        db.commit()
        db.refresh(new_response)

        from routes.learner import check_module_completion

        check_module_completion(payload.user_id, survey.module_id, db)

        return {
            "message": "Survey submitted successfully",
            "response_id": new_response.id,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to submit survey: {str(e)}"
        )


@router.put("/surveys/{survey_id}")
def update_survey(
    survey_id: int, payload: SurveyFormUpdate, db: Session = Depends(get_db)
):
    """Updates configuration properties of an active live module survey form."""
    db_survey = (
        db.query(SurveyForm)
        .filter(SurveyForm.id == survey_id, SurveyForm.is_active == True)
        .first()
    )
    if not db_survey:
        raise HTTPException(status_code=404, detail="Survey form not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_survey, key, value)

    try:
        db.commit()
        db.refresh(db_survey)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database update error: {str(e)}"
        )

    return db_survey


@router.delete("/surveys/{survey_id}")
def delete_survey(survey_id: int, db: Session = Depends(get_db)):
    """Soft-deletes a module-bound survey form instance."""
    db_survey = db.query(SurveyForm).filter(SurveyForm.id == survey_id).first()
    if not db_survey:
        raise HTTPException(
            status_code=404, detail="Target Survey form context not found"
        )

    try:
        db_survey.is_active = False
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database pipeline failure during soft-delete: {str(e)}",
        )

    return {"message": "Survey deleted successfully"}


@router.post("/surveys/{survey_id}/save-template")
def save_survey_as_template(survey_id: int, db: Session = Depends(get_db)):
    """Copies a live Module SurveyForm instance to create a brand new reusable SurveyTemplate blueprint."""
    live_survey = (
        db.query(SurveyForm)
        .options(
            joinedload(SurveyForm.questions).joinedload(SurveyQuestion.options)
        )
        .filter(SurveyForm.id == survey_id, SurveyForm.is_active == True)
        .first()
    )
    if not live_survey:
        raise HTTPException(
            status_code=404, detail="Live survey form structure not found"
        )

    try:
        base_title = live_survey.title or "Untitled Template"
        target_title = base_title
        counter = 1

        while (
            db.query(SurveyTemplate)
            .filter(SurveyTemplate.title == target_title)
            .first()
            is not None
        ):
            target_title = f"{base_title} ({counter})"
            counter += 1

        new_template = SurveyTemplate(
            title=target_title, description=live_survey.description
        )
        db.add(new_template)
        db.flush()

        for live_q in live_survey.questions:
            new_tmpl_q = SurveyTemplateQuestion(
                template_id=new_template.id,
                question=live_q.question,
                question_type=live_q.question_type,
                is_required=live_q.is_required,
                question_order=getattr(live_q, "question_order", None),
            )
            db.add(new_tmpl_q)
            db.flush()

            if live_q.options:
                for live_opt in live_q.options:
                    new_tmpl_opt = SurveyTemplateOption(
                        question_id=new_tmpl_q.id,
                        option_text=live_opt.option_text,
                        option_order=live_opt.option_order,
                    )
                    db.add(new_tmpl_opt)

        db.commit()
        return {
            "message": "Survey saved as template successfully",
            "template_id": new_template.id,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile and persist canvas layout as blueprint: {str(e)}",
        )


@router.post("/surveys/{survey_id}/questions")
def add_survey_question(
    survey_id: int, payload: SurveyQuestionCreate, db: Session = Depends(get_db)
):
    survey_exists = (
        db.query(SurveyForm)
        .filter(SurveyForm.id == survey_id, SurveyForm.is_active == True)
        .first()
    )
    if not survey_exists:
        raise HTTPException(
            status_code=404, detail="Parent Survey framework missing"
        )

    new_question = SurveyQuestion(
        survey_id=survey_id,
        question=payload.question,
        question_type=payload.question_type,
        is_required=payload.is_required,
        question_order=payload.question_order,
    )

    try:
        db.add(new_question)
        db.flush()

        if (
            payload.question_type
            in ["multiple_choice", "checkbox", "dropdown"]
            and payload.options
        ):
            for item in payload.options:
                opt_record = SurveyOption(
                    question_id=new_question.id,
                    option_text=item.option_text,
                    option_order=item.option_order,
                )
                db.add(opt_record)
        db.commit()
        db.refresh(new_question)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Survey question matrix write failure: {str(e)}",
        )

    return new_question


@router.put("/survey-questions/{question_id}")
def update_survey_question(
    question_id: int, payload: SurveyQuestionCreate, db: Session = Depends(get_db)
):
    db_question = (
        db.query(SurveyQuestion)
        .filter(SurveyQuestion.id == question_id)
        .first()
    )
    if not db_question:
        raise HTTPException(
            status_code=404, detail="Question targeted reference not found"
        )

    try:
        db_question.question = payload.question
        db_question.question_type = payload.question_type
        db_question.is_required = payload.is_required
        db_question.question_order = payload.question_order

        db.query(SurveyOption).filter(
            SurveyOption.question_id == question_id
        ).delete()

        if (
            payload.question_type
            in ["multiple_choice", "checkbox", "dropdown"]
            and payload.options
        ):
            for item in payload.options:
                opt_record = SurveyOption(
                    question_id=db_question.id,
                    option_text=item.option_text,
                    option_order=item.option_order,
                )
                db.add(opt_record)

        db.commit()
        db.refresh(db_question)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Transaction runtime update execution failure: {str(e)}",
        )

    return db_question


@router.delete("/survey-questions/{question_id}")
def delete_survey_question(question_id: int, db: Session = Depends(get_db)):
    db_question = (
        db.query(SurveyQuestion)
        .filter(SurveyQuestion.id == question_id)
        .first()
    )
    if not db_question:
        raise HTTPException(
            status_code=404, detail="Target question not found"
        )

    try:
        db.query(SurveyOption).filter(
            SurveyOption.question_id == question_id
        ).delete()
        db.delete(db_question)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database hard delete transaction dropped: {str(e)}",
        )

    return {"message": "Survey question and options deleted successfully"}


@router.post("/surveys/reuse")
def reuse_survey_template(
    payload: SurveyReuseRequest, db: Session = Depends(get_db)
):
    """Spawns completely clean configuration maps initialized from source template definitions."""
    module_exists = db.query(Module).filter(Module.id == payload.module_id).first()
    if not module_exists:
        raise HTTPException(
            status_code=404,
            detail="Target Module for template reuse not found",
        )

    template_survey = (
        db.query(SurveyForm)
        .options(
            joinedload(SurveyForm.questions).joinedload(SurveyQuestion.options)
        )
        .filter(SurveyForm.id == payload.template_id, SurveyForm.is_active == True)
        .first()
    )
    if not template_survey:
        raise HTTPException(
            status_code=404,
            detail="Active survey targeted model context not discovered",
        )

    try:
        new_survey = SurveyForm(
            module_id=payload.module_id,
            title=template_survey.title,
            description=template_survey.description,
            is_template=False,
            is_active=True,
        )
        db.add(new_survey)
        db.flush()

        for tmpl_q in template_survey.questions:
            new_q = SurveyQuestion(
                survey_id=new_survey.id,
                question=tmpl_q.question,
                question_type=tmpl_q.question_type,
                is_required=tmpl_q.is_required,
                question_order=tmpl_q.question_order,
            )
            db.add(new_q)
            db.flush()

            for tmpl_opt in tmpl_q.options:
                new_opt = SurveyOption(
                    question_id=new_q.id,
                    option_text=tmpl_opt.option_text,
                    option_order=tmpl_opt.option_order,
                )
                db.add(new_opt)

        db.commit()
        db.refresh(new_survey)
        return {"id": new_survey.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database replication runtime orchestration loop failure: {str(e)}",
        )


@router.post("/{program_id}/complete/{user_id}")
def complete_program(
    program_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id,
        )
        .first()
    )

    if progress:
        if not progress.completed:
            progress.completed = True
            progress.completed_at = datetime.utcnow()
    else:
        progress = UserProgramProgress(
            user_id=user_id,
            program_id=program_id,
            completed=True,
            completed_at=datetime.utcnow(),
        )
        db.add(progress)

    db.commit()

    try:
        create_program_completion_notifications(
            user_id=user_id,
            program_id=program_id,
            db=db,
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to create completion notifications: {e}")

    completed_programs = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.completed == True,
        )
        .count()
    )

    badges = db.query(Badge).all()
    new_badges = []

    for badge in badges:
        if completed_programs >= badge.requirement_value:
            already_badge = (
                db.query(UserBadge)
                .filter(
                    UserBadge.user_id == user_id,
                    UserBadge.badge_id == badge.badge_id,
                )
                .first()
            )

            if not already_badge:
                user_badge = UserBadge(
                    user_id=user_id,
                    badge_id=badge.badge_id,
                )

                db.add(user_badge)
                new_badges.append(badge.badge_name)

    db.commit()

    return {
        "message": "Program completed successfully",
        "new_badges": new_badges,
    }


@router.post("/{program_id}/retention/{user_id}")
def complete_retention_quiz(
    program_id: int, user_id: int, db: Session = Depends(get_db)
):
    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id,
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=404, detail="Program progress not found"
        )

    if progress.retention_quiz:
        return {"message": "Retention quiz already completed"}

    progress.retention_quiz = True
    db.commit()

    try:
        program = db.query(Program).filter(Program.id == program_id).first()
        user = db.query(User).filter(User.user_id == user_id).first()
        admins = (
            db.query(User)
            .filter(User.is_active == True, User.role_id.in_([1, 2]))
            .all()
        )
        for admin in admins:
            employee_name = user.full_name if user else "A user"
            program_name = program.name if program else "Program"
            notif = UserNotification(
                user_id=admin.user_id,
                program_id=program_id,
                title="Retention Quiz Completed",
                message=f"{employee_name} completed the Retention Quiz for {program_name}.",
            )
            db.add(notif)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to create retention quiz notification: {e}")

    retention_completed = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.retention_quiz == True,
        )
        .count()
    )

    badges = db.query(Badge).filter(Badge.badge_type == "retention").all()
    new_badges = []

    for badge in badges:
        if retention_completed >= badge.requirement_value:
            already = (
                db.query(UserBadge)
                .filter(
                    UserBadge.user_id == user_id,
                    UserBadge.badge_id == badge.badge_id,
                )
                .first()
            )

            if not already:
                user_badge = UserBadge(user_id=user_id, badge_id=badge.badge_id)
                db.add(user_badge)
                new_badges.append(badge.badge_name)

    db.commit()

    return {
        "message": "Retention quiz completed successfully",
        "new_badges": new_badges,
    }


@router.post("/{program_id}/application-check/{check_number}/submit")
def submit_application_check_endpoint(
    program_id: int,
    check_number: int,
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
):
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    app_check = (
        db.query(ApplicationCheck)
        .options(joinedload(ApplicationCheck.questions))
        .filter(
            ApplicationCheck.program_id == program_id,
            ApplicationCheck.check_number == check_number,
        )
        .first()
    )
    if not app_check:
        raise HTTPException(status_code=404, detail="Application check not found")

    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        total_questions = len(app_check.questions)

        if total_questions == 0:
            raise HTTPException(
                status_code=400,
            detail="Application check has no questions"
            )

        # Get automation setting
        automation_setting = (
            db.query(ApplicationCheckAutomationSetting)
            .first()
        )

        automation_enabled = (
            automation_setting.is_enabled
            if automation_setting
            else False
        )

        submitted_answers = [
            ans.dict()
            for ans in payload.answers
        ]

        # Create a map of submitted answers by question ID
        answer_map = {
            answer.get("question_id"): answer
            for answer in submitted_answers
        }

        # Check whether any Application Check question is missing or empty
        has_empty_required_answer = False

        for question in app_check.questions:
            submitted_answer = answer_map.get(question.id)

            if not submitted_answer:
                has_empty_required_answer = True
                break

            answer_text = (
                submitted_answer.get("answer")
                or ""
            )

            if not str(answer_text).strip():
                has_empty_required_answer = True
                break
        # Decide status
        if automation_enabled:
            submission_status = (
                "Rejected"
                if has_empty_required_answer
                else "Approved"
            )
        else:
            submission_status = "Submitted"

        # Save attempt
        attempt = ApplicationCheckAttempt(
            user_id=payload.user_id,
            application_check_id=app_check.id,
            score=None,
            total_questions=total_questions,
            percentage=None,
            passed=None,
            answers=submitted_answers,
            attempted_at=datetime.utcnow(),
        )

        db.add(attempt)
        db.flush()

        # Get or create progress
        progress = (
            db.query(UserApplicationCheckProgress)
            .filter(
                UserApplicationCheckProgress.user_id
                == payload.user_id,
                UserApplicationCheckProgress.application_check_id
                == app_check.id,
            )
            .first()
        )

        if not progress:
            progress = UserApplicationCheckProgress(
                user_id=payload.user_id,
                program_id=program_id,
                application_check_id=app_check.id,
                status=submission_status,
            )
            db.add(progress)
        else:
            progress.status = submission_status

        # Manual mode: notify Admin/Master Admin
        if not automation_enabled:
            admins = (
                db.query(User)
                .filter(
                    User.is_active == True,
                    User.role_id.in_([1, 2])
                )
                .all()
            )

            for admin in admins:
                notification_title = "Application Check Submitted"

                notification_message = (
                    f"{user.full_name} has completed and submitted "
                    f"Application Check {check_number} "
                    f"for the program {program.name}. "
                    f"Please review the submission."
                )

                admin_notif = UserNotification(
                    user_id=admin.user_id,
                    program_id=program_id,
                    application_check_id=app_check.id,
                    title=notification_title,
                    message=notification_message,
                )

                db.add(admin_notif)

                # Send email to Admin/Master Admin
                if admin.email:
                    try:
                        send_notification_email(
                            to_email=admin.email,
                            title=notification_title,
                            message=notification_message,
                        )
                    except Exception as e:
                        print(
                            f"Failed to send Application Check submission "
                            f"email to admin {admin.email}: {e}"
                        )

        # Automated mode: notify learner
        else:
            if submission_status == "Approved":
                notification_title = "Application Check Approved"
                notification_message = (
                    f"Your Application Check {check_number} "
                    f"for {program.name} has been automatically approved."
                )
            else:
                notification_title = "Application Check Rejected"
                notification_message = (
                    f"Your Application Check {check_number} "
                    f"for {program.name} was rejected because "
                    f"a required answer was missing. "
                    f"Please reattempt the Application Check."
                )

            learner_notification = UserNotification(
                user_id=payload.user_id,
                program_id=program_id,
                application_check_id=app_check.id,
                title=notification_title,
                message=notification_message,
            )

            db.add(learner_notification)

            # Send learner email
            if user.email:
                try:
                    send_notification_email(
                        to_email=user.email,
                        title=notification_title,
                        message=notification_message,
                    )
                except Exception as e:
                    print(
                        f"Failed to send Application Check "
                        f"automation email: {e}"
                    )

        db.commit()
        db.refresh(attempt)

        if automation_enabled:
            return {
                "message": (
                    "Application check automatically approved"
                    if submission_status == "Approved"
                    else "Application check automatically rejected. "
                        "Please reattempt."
                ),
                "attempt_id": attempt.id,
                "status": submission_status,
                "automation_enabled": True,
            }

        return {
            "message": (
                "Application check submitted successfully "
                "and is pending admin review"
            ),
            "attempt_id": attempt.id,
            "status": "Submitted",
            "automation_enabled": False,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to submit application check: {str(e)}"
            ),
        )

@router.post("/{program_id}/streak/{user_id}")
def complete_streak(
    program_id: int, user_id: int, db: Session = Depends(get_db)
):
    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id,
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=404, detail="Program progress not found"
        )

    if progress.streak_completed:
        return {"message": "Streak already counted"}

    progress.streak_completed = True
    db.commit()

    streak_count = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.streak_completed == True,
        )
        .count()
    )

    badges = db.query(Badge).filter(Badge.badge_type == "streak").all()
    new_badges = []

    for badge in badges:
        if streak_count >= badge.requirement_value:
            already = (
                db.query(UserBadge)
                .filter(
                    UserBadge.user_id == user_id,
                    UserBadge.badge_id == badge.badge_id,
                )
                .first()
            )

            if not already:
                user_badge = UserBadge(user_id=user_id, badge_id=badge.badge_id)
                db.add(user_badge)
                new_badges.append(badge.badge_name)

    db.commit()

    return {
        "message": "Streak updated successfully",
        "streak_count": streak_count,
        "new_badges": new_badges,
    }


@router.post("/{program_id}/application/{user_id}")
def complete_application(
    program_id: int, user_id: int, db: Session = Depends(get_db)
):
    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id,
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=404, detail="Program progress not found"
        )

    if progress.application_completed:
        return {"message": "Application already submitted"}

    progress.application_completed = True
    db.commit()

    application_count = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.application_completed == True,
        )
        .count()
    )

    badges = db.query(Badge).filter(Badge.badge_type == "application").all()
    new_badges = []

    for badge in badges:
        if application_count >= badge.requirement_value:
            already = (
                db.query(UserBadge)
                .filter(
                    UserBadge.user_id == user_id,
                    UserBadge.badge_id == badge.badge_id,
                )
                .first()
            )

            if not already:
                user_badge = UserBadge(user_id=user_id, badge_id=badge.badge_id)
                db.add(user_badge)
                new_badges.append(badge.badge_name)

    db.commit()

    return {
        "message": "Application submitted successfully",
        "application_count": application_count,
        "new_badges": new_badges,
    }