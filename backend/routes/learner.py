from datetime import date, datetime
from typing import List, Optional

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from models import (
    ApplicationCheck,
    ApplicationCheckAttempt,
    ApplicationCheckQuestion,
    Assignment,
    AssignmentSubmission,
    Badge,
    LearningStreak,
    Module,
    ModuleCompletion,
    Program,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    RetentionQuiz,
    RetentionQuizAttempt,
    RetentionQuizQuestion,
    SurveyCompletion,
    SurveyForm,
    User,
    UserApplicationCheckProgress,
    UserBadge,
    UserProgramProgress,
    Video,
    VideoCompletion,
    WrittenLesson,
    WrittenLessonCompletion,
    ApplicationCheckAutomationSetting,
    UserNotification,
)
from pydantic import BaseModel
from routes.notification_helpers import (
    create_admin_notification,
    create_program_completion_notifications,
    create_retention_quiz_completion_notification,
    create_retention_quiz_failed_notification,
)

from email_service import send_notification_email

from schemas import (
    ApplicationCheckAttemptCreate,
    ApplicationCheckAttemptResponse,
    AvailableQuizResponse,
    BadgeCreate,
    LearnerStatsResponse,
    ModuleCompletionCreate,
    ModuleCompletionResponse,
    ModuleCompletionUpdate,
    QuizAttemptCreate,
    RetentionQuizAttemptCreate,
    RetentionQuizAttemptResponse,
    SurveyCompletionCreate,
    SurveyCompletionResponse,
    SurveyCompletionUpdate,
    UserProgramProgressCreate,
    UserProgramProgressUpdate,
    VideoCompletionCreate,
    VideoCompletionUpdate,
    WrittenLessonCompletionCreate,
    WrittenLessonCompletionResponse,
    WrittenLessonCompletionUpdate,
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/learner", tags=["Learner"])


# ==========================================
# LEARNER STATS ENDPOINT
# ==========================================


@router.get("/stats/{user_id}")
def get_learner_stats(user_id: int, db: Session = Depends(get_db)):
    """Get comprehensive learner statistics including progress, badges, streak, and curos."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Program progress stats (Optimized to query specific IDs rather than whole rows)
    total_programs = db.query(Program.id).count()
    completed_programs = (
        db.query(UserProgramProgress.id)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.status == "Completed",
        )
        .count()
    )
    in_progress_programs = (
        db.query(UserProgramProgress.id)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.status == "In Progress",
        )
        .count()
    )

    # Video completion stats
    videos_watched = (
        db.query(VideoCompletion.id)
        .filter(
            VideoCompletion.user_id == user_id,
            VideoCompletion.is_completed == True,
        )
        .count()
    )

    # Quiz stats
    quizzes_passed = (
        db.query(QuizAttempt.id)
        .filter(QuizAttempt.user_id == user_id, QuizAttempt.passed == True)
        .count()
    )

    # Badge stats
    badges_earned = (
        db.query(UserBadge.user_badge_id)
        .filter(UserBadge.user_id == user_id)
        .count()
    )

    # Streak stats
    streak = (
        db.query(LearningStreak)
        .filter(LearningStreak.user_id == user_id)
        .first()
    )
    current_streak = streak.current_streak if streak else 0

    return LearnerStatsResponse(
        total_programs=total_programs,
        completed_programs=completed_programs,
        in_progress_programs=in_progress_programs,
        videos_watched=videos_watched,
        quizzes_passed=quizzes_passed,
        badges_earned=badges_earned,
        current_streak=current_streak,
        total_curos=user.curos,
    )


# ==========================================
# USER PROGRAM PROGRESS
# ==========================================


@router.post("/progress")
def create_program_progress(
    request: UserProgramProgressCreate, db: Session = Depends(get_db)
):
    """Create a new program progress entry for a user."""
    existing = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == request.user_id,
            UserProgramProgress.program_id == request.program_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Progress already exists for this program"
        )

    progress = UserProgramProgress(
        user_id=request.user_id,
        program_id=request.program_id,
        status="In Progress",
        progress_percentage=0,
    )

    db.add(progress)
    db.commit()
    db.refresh(progress)

    return progress


@router.get("/progress/{user_id}")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get all program progress for a specific user."""
    return (
        db.query(UserProgramProgress)
        .filter(UserProgramProgress.user_id == user_id)
        .all()
    )


@router.put("/progress/{progress_id}")
def update_program_progress(
    progress_id: int,
    request: UserProgramProgressUpdate,
    db: Session = Depends(get_db),
):
    """Update program progress (status, percentage, completion)."""
    progress = (
        db.query(UserProgramProgress)
        .filter(UserProgramProgress.id == progress_id)
        .first()
    )
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(progress, key, value)

    progress.last_accessed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress


# ==========================================
# VIDEO COMPLETION TRACKING
# ==========================================


@router.post("/video-progress")
def create_or_update_video_progress(
    request: VideoCompletionCreate,
    video_duration: int = 0,  # Total video duration in seconds
    db: Session = Depends(get_db),
):
    """Create or update video progress for a user.

    Auto-completes when 90% of video is watched. Manual completion allowed when
    >= 20% watched. Idempotent: multiple calls won't create duplicates.
    """
    print(f"=== VIDEO PROGRESS UPDATE ===")
    print(f"User ID: {request.user_id}, Video ID: {request.video_id}")
    print(
        f"Watch time: {request.watch_time_seconds}, Is completed requested: {request.is_completed}"
    )

    video = db.query(Video).filter(Video.id == request.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    print(f"Video found: {video.title}, Module ID: {video.module_id}")

    # Get or create video progress
    progress = (
        db.query(VideoCompletion)
        .filter(
            VideoCompletion.user_id == request.user_id,
            VideoCompletion.video_id == request.video_id,
        )
        .first()
    )

    if not progress:
        print("Creating new video progress record")
        progress = VideoCompletion(
            user_id=request.user_id,
            video_id=request.video_id,
            watch_time_seconds=request.watch_time_seconds,
            last_position=request.last_position,
            is_completed=False,
        )
        db.add(progress)
    else:
        print(
            f"Updating existing video progress, current is_completed: {progress.is_completed}"
        )
        progress.watch_time_seconds = max(
            progress.watch_time_seconds or 0, request.watch_time_seconds or 0
        )
        progress.last_position = request.last_position

    # Calculate watch percentage
    watch_percentage = 0
    if video_duration > 0:
        watch_percentage = min(
            (progress.watch_time_seconds / video_duration) * 100, 100
        )

    print(f"Video duration: {video_duration}s")
    print(f"Actual watch time: {progress.watch_time_seconds}s")
    print(f"Watch percentage: {watch_percentage}%")

    automatic_completion = watch_percentage >= 90
    manual_completion = request.is_completed is True and watch_percentage >= 20

    if (
        request.is_completed is True
        and watch_percentage < 20
        and not progress.is_completed
    ):
        raise HTTPException(
            status_code=400,
            detail="You must watch at least 20% of the video before marking it as complete.",
        )

    completion_requested = automatic_completion or manual_completion

    was_already_completed = progress.is_completed
    newly_completed = False

    if completion_requested and not progress.is_completed:
        print("Marking video as completed")
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        update_learning_streak(request.user_id, db)
        newly_completed = True
    elif progress.is_completed:
        print("Video already completed, skipping new completion triggers")

    db.commit()
    db.refresh(progress)
    print(f"Video progress saved, is_completed: {progress.is_completed}")

    # Check module completion if video was just newly completed
    if newly_completed:
        print(f"Checking module completion for module {video.module_id}")
        result = check_module_completion(request.user_id, video.module_id, db)
        print(f"Module completion check result: {result}")

    return progress


@router.get("/video-progress/{user_id}")
def get_user_video_progress(user_id: int, db: Session = Depends(get_db)):
    """Get all video progress for a specific user."""
    return (
        db.query(VideoCompletion)
        .filter(VideoCompletion.user_id == user_id)
        .all()
    )


# ==========================================
# QUIZ ATTEMPTS
# ==========================================


@router.post("/quiz-attempt")
def create_quiz_attempt(request: QuizAttemptCreate, db: Session = Depends(get_db)):
    """Record a quiz attempt and calculate score.

    Auto-completes when all mandatory questions are answered and submitted.
    """
    quiz = db.query(Quiz).filter(Quiz.id == request.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Get correct answers
    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == request.quiz_id)
        .all()
    )
    total_questions = len(questions)
    correct_count = 0

    # Calculate score (Optimized with a dictionary for O(1) lookups instead of O(N*M))
    questions_dict = {q.id: q for q in questions}
    for answer in request.answers:
        question_id = answer.get("question_id")
        selected_option = answer.get("selected_option")

        question = questions_dict.get(question_id)

        if question:
            correct_option = next(
                (opt["text"] for opt in question.options if opt.get("isCorrect")),
                None,
            )

            if selected_option == correct_option:
                correct_count += 1

    score = (
        int((correct_count / total_questions) * 100)
        if total_questions > 0
        else 0
    )
    passed = score >= 40

    attempt = QuizAttempt(
        user_id=request.user_id,
        quiz_id=request.quiz_id,
        score=score,
        total_questions=total_questions,
        total_marks=sum(q.marks for q in questions),
        percentage=score,
        passed=passed,
        attempt_number=request.attempt_number,
        answers=request.answers,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Prepare detailed question-wise result
    question_results = []

    for question in questions:
        submitted_answer = next(
            (
                answer.get("selected_option")
                for answer in request.answers
                if answer.get("question_id") == question.id
            ),
            None,
        )

        correct_answer = next(
            (
                option.get("text")
                for option in question.options
                if option.get("isCorrect")
            ),
            None,
        )

        is_correct = submitted_answer == correct_answer

        question_results.append(
            {
                "question_id": question.id,
                "question": question.question,
                "selected_answer": submitted_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": question.explanation,
            }
        )

    # Update learning streak on quiz attempt
    update_learning_streak(request.user_id, db)

    # Check module completion after quiz attempt (only if passed)
    if passed:
        check_module_completion(request.user_id, quiz.module_id, db)

    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "quiz_id": attempt.quiz_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "passed": attempt.passed,
        "attempt_number": attempt.attempt_number,
        "attempted_at": attempt.attempted_at,
        "question_results": question_results,
    }


@router.get("/quiz-attempts/{user_id}")
def get_user_quiz_attempts(user_id: int, db: Session = Depends(get_db)):
    """Get all quiz attempts for a specific user."""
    return db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).all()


@router.get("/quiz-attempt/{user_id}/{quiz_id}/latest")
def get_latest_quiz_result(user_id: int, quiz_id: int, db: Session = Depends(get_db)):
    """Get the latest quiz attempt with detailed question-wise results."""

    # Get latest attempt
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id == quiz_id)
        .order_by(QuizAttempt.attempted_at.desc(), QuizAttempt.id.desc())
        .first()
    )

    if not attempt:
        raise HTTPException(status_code=404, detail="No quiz attempt found")

    # Get quiz questions
    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == quiz_id)
        .order_by(QuizQuestion.id)
        .all()
    )

    question_results = []

    # Answers saved in the attempt
    saved_answers = attempt.answers or []

    for question in questions:

        # Find user's answer for this question
        submitted_answer = next(
            (
                answer.get("selected_option")
                for answer in saved_answers
                if answer.get("question_id") == question.id
            ),
            None,
        )

        # Find correct answer
        correct_answer = next(
            (
                option.get("text")
                for option in question.options
                if option.get("isCorrect")
            ),
            None,
        )

        question_results.append(
            {
                "question_id": question.id,
                "question": question.question,
                "selected_answer": submitted_answer,
                "correct_answer": correct_answer,
                "is_correct": submitted_answer == correct_answer,
                "explanation": question.explanation,
            }
        )

    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "quiz_id": attempt.quiz_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "total_marks": attempt.total_marks,
        "percentage": float(attempt.percentage or 0),
        "passed": attempt.passed,
        "attempt_number": attempt.attempt_number,
        "attempted_at": attempt.attempted_at,
        "question_results": question_results,
    }


# ==========================================
# GAMIFICATION - BADGES
# ==========================================


@router.post("/badges")
def create_badge(request: BadgeCreate, db: Session = Depends(get_db)):
    """Create a new badge (admin function)."""
    badge = Badge(
        name=request.name,
        description=request.description,
        icon_url=request.icon_url,
        requirement_type=request.requirement_type,
        requirement_value=request.requirement_value,
        curos_reward=request.curos_reward,
    )

    db.add(badge)
    db.commit()
    db.refresh(badge)

    return badge


@router.get("/badges")
def get_all_badges(db: Session = Depends(get_db)):
    """Get all available badges."""
    return db.query(Badge).filter(Badge.is_active == True).all()


@router.get("/badges/{user_id}")
def get_user_badges(user_id: int, db: Session = Depends(get_db)):
    """Get all badges earned by a specific user."""
    return db.query(UserBadge).filter(UserBadge.user_id == user_id).all()


# ==========================================
# GAMIFICATION - LEARNING STREAK
# ==========================================


@router.post("/streak/{user_id}")
def update_learning_streak(user_id: int, db: Session = Depends(get_db)):
    """Update learning streak for a user (call after any learning activity)."""
    streak = (
        db.query(LearningStreak)
        .filter(LearningStreak.user_id == user_id)
        .first()
    )

    today = date.today()

    if not streak:
        # Create new streak
        streak = LearningStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_activity_date=today,
        )
        db.add(streak)
    else:
        # Check if activity was yesterday or today
        if streak.last_activity_date:
            days_diff = (today - streak.last_activity_date).days

            if days_diff == 0:
                # Same day, no change
                pass
            elif days_diff == 1:
                # Consecutive day, increment streak
                streak.current_streak += 1
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
            else:
                # Streak broken, reset
                streak.current_streak = 1

        streak.last_activity_date = today
        streak.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(streak)

    return streak


@router.get("/streak/{user_id}")
def get_learning_streak(user_id: int, db: Session = Depends(get_db)):
    """Get learning streak for a specific user."""
    streak = (
        db.query(LearningStreak)
        .filter(LearningStreak.user_id == user_id)
        .first()
    )
    if not streak:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
        }
    return streak


# ==========================================
# WRITTEN LESSON COMPLETION TRACKING
# ==========================================


@router.post("/written-lesson-progress")
def create_or_update_written_lesson_progress(
    request: WrittenLessonCompletionCreate, db: Session = Depends(get_db)
):
    """Create or update written lesson progress for a user.

    Idempotent: multiple calls won't create duplicates.
    """
    # Get or create progress
    progress = (
        db.query(WrittenLessonCompletion)
        .filter(
            WrittenLessonCompletion.user_id == request.user_id,
            WrittenLessonCompletion.lesson_id == request.lesson_id,
        )
        .first()
    )

    lesson = (
        db.query(WrittenLesson)
        .filter(WrittenLesson.id == request.lesson_id)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Written lesson not found")

    if not progress:
        # Create new progress entry
        progress = WrittenLessonCompletion(
            user_id=request.user_id,
            lesson_id=request.lesson_id,
            scroll_position=request.scroll_position,
            is_completed=False,
        )
        db.add(progress)
    else:
        # Update existing progress
        progress.scroll_position = request.scroll_position

    # Mark complete if requested
    if request.is_completed and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        # Update learning streak
        update_learning_streak(request.user_id, db)

    db.commit()
    db.refresh(progress)

    # Check module completion if lesson was just completed
    if progress.is_completed and request.is_completed:
        check_module_completion(request.user_id, lesson.module_id, db)

    return progress


@router.get("/written-lesson-progress/{user_id}")
def get_user_written_lesson_progress(
    user_id: int, db: Session = Depends(get_db)
):
    """Get all written lesson progress for a specific user."""
    return (
        db.query(WrittenLessonCompletion)
        .filter(WrittenLessonCompletion.user_id == user_id)
        .all()
    )


# ==========================================
# SURVEY COMPLETION TRACKING
# ==========================================


@router.post("/survey-progress")
def create_or_update_survey_progress(
    request: SurveyCompletionCreate, db: Session = Depends(get_db)
):
    """Create or update survey progress for a user.

    Idempotent: multiple calls won't create duplicates.
    """
    # Get or create progress
    progress = (
        db.query(SurveyCompletion)
        .filter(
            SurveyCompletion.user_id == request.user_id,
            SurveyCompletion.survey_id == request.survey_id,
        )
        .first()
    )

    survey = (
        db.query(SurveyForm).filter(SurveyForm.id == request.survey_id).first()
    )
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    if not progress:
        # Create new progress entry
        progress = SurveyCompletion(
            user_id=request.user_id,
            survey_id=request.survey_id,
            is_completed=False,
        )
        db.add(progress)

    # Mark complete if requested
    if request.is_completed and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        # Update learning streak
        update_learning_streak(request.user_id, db)

    db.commit()
    db.refresh(progress)

    # Check module completion if survey was just completed
    if progress.is_completed and request.is_completed:
        check_module_completion(request.user_id, survey.module_id, db)

    return progress


@router.get("/survey-progress/{user_id}")
def get_user_survey_progress(user_id: int, db: Session = Depends(get_db)):
    """Get all survey progress for a specific user."""
    return (
        db.query(SurveyCompletion)
        .filter(SurveyCompletion.user_id == user_id)
        .all()
    )


# ==========================================
# ASSIGNMENT SUBMISSION TRACKING
# ==========================================


@router.post("/assignment-submission")
def create_or_update_assignment_submission(
    user_id: int,
    assignment_id: int,
    text_answer: str = None,
    file_url: str = None,
    db: Session = Depends(get_db),
):
    """Create or update an assignment submission for a user.

    Idempotent: multiple calls won't create duplicates.
    """
    assignment = (
        db.query(Assignment)
        .filter(Assignment.assignment_id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Get or create submission
    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.user_id == user_id,
            AssignmentSubmission.assignment_id == assignment_id,
        )
        .first()
    )

    if not submission:
        # Create new submission
        submission = AssignmentSubmission(
            user_id=user_id,
            assignment_id=assignment_id,
            text_answer=text_answer,
            file_url=file_url,
            status="Submitted",
        )
        db.add(submission)
    else:
        # Update existing submission
        if text_answer:
            submission.text_answer = text_answer
        if file_url:
            submission.file_url = file_url
        submission.submitted_at = datetime.utcnow()
        submission.status = "Submitted"

    db.commit()
    db.refresh(submission)

    # Update learning streak
    update_learning_streak(user_id, db)

    # Check module completion after submission
    check_module_completion(user_id, assignment.module_id, db)

    return submission


@router.get("/assignment-submissions/{user_id}")
def get_user_assignment_submissions(
    user_id: int, db: Session = Depends(get_db)
):
    """Get all assignment submissions for a specific user."""
    return (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.user_id == user_id)
        .all()
    )


# ==========================================
# MODULE COMPLETION TRACKING
# ==========================================


@router.put("/module-progress/{progress_id}")
def update_module_progress(
    progress_id: int,
    request: ModuleCompletionUpdate,
    db: Session = Depends(get_db),
):
    """Update module completion status and progress."""
    progress = (
        db.query(ModuleCompletion)
        .filter(ModuleCompletion.id == progress_id)
        .first()
    )
    if not progress:
        raise HTTPException(status_code=404, detail="Module progress not found")

    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(progress, key, value)

    if request.is_completed and not progress.completed_at:
        progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress


@router.get("/module-progress/{user_id}/{program_id}")
def get_user_module_progress(
    user_id: int, program_id: int, db: Session = Depends(get_db)
):
    module_completions = (
        db.query(ModuleCompletion)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.program_id == program_id,
        )
        .all()
    )

    # Memory optimized queries returning just the ID
    completed_videos = (
        db.query(VideoCompletion.video_id)
        .join(Video, Video.id == VideoCompletion.video_id)
        .join(Module, Module.id == Video.module_id)
        .filter(
            VideoCompletion.user_id == user_id,
            VideoCompletion.is_completed == True,
            Module.program_id == program_id,
        )
        .all()
    )

    passed_quiz_ids = (
        db.query(QuizAttempt.quiz_id)
        .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
        .join(Module, Module.id == Quiz.module_id)
        .filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.passed == True,
            Module.program_id == program_id,
        )
        .distinct()
        .all()
    )

    completed_lessons = (
        db.query(WrittenLessonCompletion.lesson_id)
        .join(WrittenLesson, WrittenLesson.id == WrittenLessonCompletion.lesson_id)
        .join(Module, Module.id == WrittenLesson.module_id)
        .filter(
            WrittenLessonCompletion.user_id == user_id,
            WrittenLessonCompletion.is_completed == True,
            Module.program_id == program_id,
        )
        .all()
    )

    completed_surveys = (
        db.query(SurveyCompletion.survey_id)
        .join(SurveyForm, SurveyForm.id == SurveyCompletion.survey_id)
        .join(Module, Module.id == SurveyForm.module_id)
        .filter(
            SurveyCompletion.user_id == user_id,
            SurveyCompletion.is_completed == True,
            Module.program_id == program_id,
        )
        .all()
    )

    content_progress = {}
    content_progress.update({f"video-{v[0]}": True for v in completed_videos})
    content_progress.update({f"quiz-{qid}": True for (qid,) in passed_quiz_ids})
    content_progress.update(
        {f"written_lesson-{l[0]}": True for l in completed_lessons}
    )
    content_progress.update({f"survey-{s[0]}": True for s in completed_surveys})

    return {
        "completed_modules": [m.module_id for m in module_completions],
        "content_progress": content_progress,
    }


class ModuleCompleteRequest(BaseModel):
    user_id: int
    module_id: int
    program_id: int


@router.post("/module/complete")
def mark_module_complete(
    request: ModuleCompleteRequest, db: Session = Depends(get_db)
):
    """Mark a module as complete for a user."""
    user_id = request.user_id
    module_id = request.module_id
    program_id = request.program_id

    print(f"\n{'='*60}")
    print(f"=== MARKING MODULE COMPLETE ===")
    print(f"{'='*60}")
    print(f"User ID: {user_id}, Module ID: {module_id}, Program ID: {program_id}")

    # DEBUG STEP 1: Check user and current curos
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        print(f"ERROR: User {user_id} not found!")
        return {"error": "User not found", "user_id": user_id}
    print(
        f"STEP 1 - User found: ID={user.user_id}, Current curos BEFORE any changes: {user.curos}"
    )

    # DEBUG STEP 2: Check module and its curos
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        print(f"ERROR: Module {module_id} not found!")
        return {"error": "Module not found", "module_id": module_id}
    print(
        f"STEP 2 - Module found: ID={module.id}, Title='{module.title}', Curos value={module.curos}"
    )

    # DEBUG STEP 3: Check existing progress
    progress = (
        db.query(ModuleCompletion)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.module_id == module_id,
        )
        .first()
    )

    was_completed = False

    if not progress:
        print("STEP 3 - No existing progress record, creating new one")
        progress = ModuleCompletion(
            user_id=user_id, module_id=module_id, program_id=program_id
        )
        db.add(progress)
        db.flush()  # This assigns an ID without committing
        print(f"  Created progress record with ID: {progress.id}")
    else:
        was_completed = progress.is_completed
        print(
            f"STEP 3 - Existing progress found: ID={progress.id}, was_completed={was_completed}"
        )

    # DEBUG STEP 4: Mark as complete
    print(f"STEP 4 - Marking module as complete")
    progress.is_completed = True
    progress.completed_at = datetime.utcnow()
    progress.progress_percentage = 100
    print(f"  Set is_completed=True, completed_at={progress.completed_at}")

    # DEBUG STEP 5: Award module curos
    if not was_completed:
        print(f"STEP 5 - Awarding module curos (first time completion)")
        module_curos = module.curos if module else 0
        print(f"  Module curos to award: {module_curos}")

        if module_curos > 0:
            # Refresh user to make sure we have latest
            db.refresh(user)
            old_curos = user.curos or 0
            new_curos = old_curos + module_curos

            print(f"  User curos: {old_curos} → {new_curos}")
            print(f"  Setting user.curos = {new_curos}")

            user.curos = new_curos

            # Force SQLAlchemy to track the change
            db.add(user)

            # Check if change is detected
            print(f"  Is user dirty? {db.object_session(user).is_modified(user)}")
            print(f"  User in session? {user in db}")
        else:
            print("  Module has 0 curos, skipping module curos award")
    else:
        print(
            f"STEP 5 - Module already completed, skipping module curos award"
        )

    # DEBUG STEP 6: Commit the changes
    print(f"STEP 6 - Committing module completion and curos...")
    try:
        db.commit()
        print("  COMMIT SUCCESSFUL!")
    except Exception as e:
        print(f"  COMMIT FAILED: {e}")
        db.rollback()
        raise

    # DEBUG STEP 7: Verify module curos were saved
    db.refresh(progress)
    user_after_commit = (
        db.query(User).filter(User.user_id == user_id).first()
    )
    print(
        f"STEP 7 - User curos AFTER commit (before program progress update): {user_after_commit.curos}"
    )

    # DEBUG STEP 8: Update program progress
    print(f"STEP 8 - Calling update_program_progress_after_module_completion...")
    try:
        update_program_progress_after_module_completion(
            user_id, program_id, db
        )
        print("  Program progress update completed")
    except Exception as e:
        print(f"  Program progress update failed: {e}")
        raise

    # DEBUG STEP 9: Final verification
    user_final = db.query(User).filter(User.user_id == user_id).first()
    print(f"STEP 9 - User curos FINAL: {user_final.curos}")

    # DEBUG STEP 10: Check if module curos was awarded
    module_curos_awarded = not was_completed and (module.curos or 0) > 0
    curos_increased = user_final.curos > user.curos if user else False

    print(f"STEP 10 - Summary:")
    print(f"  Module curos award attempted: {module_curos_awarded}")
    print(f"  Curos increased: {curos_increased}")
    print(f"  Initial curos: {user.curos}")
    print(f"  Final curos: {user_final.curos}")
    print(f"  Difference: {user_final.curos - user.curos}")
    print(f"{'='*60}\n")

    # Return updated progress data
    program_progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id,
        )
        .first()
    )

    if program_progress:
        completed_modules = (
            db.query(ModuleCompletion)
            .filter(
                ModuleCompletion.user_id == user_id,
                ModuleCompletion.program_id == program_id,
                ModuleCompletion.is_completed == True,
            )
            .all()
        )
        completed_module_ids = [cm.module_id for cm in completed_modules]

        return {
            "id": program_progress.id,
            "user_id": program_progress.user_id,
            "program_id": program_progress.program_id,
            "status": program_progress.status,
            "completed_percentage": program_progress.completed_percentage,
            "completed": program_progress.completed,
            "completed_modules": completed_module_ids,
            "current_module": module_id,
            "user_curos_before": user.curos,
            "user_curos_after": user_final.curos,
            "module_curos_awarded": module_curos_awarded,
            "module_curos_value": module.curos if module else 0,
            "curos_increased": curos_increased,
        }

    return {
        "message": "Module completed",
        "user_curos": user_final.curos,
        "module_curos_awarded": module_curos_awarded,
    }


@router.get("/progress/{user_id}/{program_id}")
def get_user_program_progress(
    user_id: int, program_id: int, db: Session = Depends(get_db)
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
        # Create progress record if it doesn't exist
        print(
            f"Creating new progress record for user {user_id}, program {program_id}"
        )
        progress = UserProgramProgress(
            user_id=user_id,
            program_id=program_id,
            status="In Progress",
            completed_percentage=0,
            completed=False,
            current_module=None,
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # Get completed modules list (Optimized selection)
    completed_modules = (
        db.query(ModuleCompletion.module_id)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.program_id == program_id,
            ModuleCompletion.is_completed == True,
        )
        .all()
    )
    completed_module_ids = [cm[0] for cm in completed_modules]

    # Use current_module from database if available, otherwise calculate it
    current_module = progress.current_module

    if current_module is None:
        # Fallback: determine current module (first incomplete module)
        all_modules = (
            db.query(Module.id)
            .filter(Module.program_id == program_id)
            .order_by(Module.module_order)
            .all()
        )

        for module in all_modules:
            if module[0] not in completed_module_ids:
                current_module = module[0]
                break

        # If all modules are completed, set current_module to the last one
        if current_module is None and len(all_modules) > 0:
            current_module = all_modules[-1][0]

        # Update the database with the calculated current_module
        progress.current_module = current_module
        db.commit()

    print(
        f"User {user_id} Program {program_id} - Completed Modules: {completed_module_ids}, Current Module: {current_module}"
    )

    return {
        "id": progress.id,
        "user_id": progress.user_id,
        "program_id": progress.program_id,
        "status": progress.status,
        "completed_percentage": progress.completed_percentage,
        "completed": progress.completed,
        "completed_modules": completed_module_ids,
        "current_module": current_module,
    }


# ==========================================
# RETENTION QUIZ ATTEMPTS
# ==========================================


@router.post("/retention-quiz/attempt")
def create_retention_quiz_attempt(
    request: RetentionQuizAttemptCreate, db: Session = Depends(get_db)
):
    """Record a retention quiz attempt and calculate score."""
    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(RetentionQuiz.id == request.retention_quiz_id)
        .first()
    )
    if not retention_quiz:
        raise HTTPException(status_code=404, detail="Retention quiz not found")

    # Check if user has completed the program
    program = (
        db.query(Program)
        .filter(Program.id == retention_quiz.program_id)
        .first()
    )
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == request.user_id,
            UserProgramProgress.program_id == program.id,
            UserProgramProgress.completed == True,
            UserProgramProgress.completed_at.isnot(None),
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=403,
            detail="You must complete the program before attempting the retention quiz",
        )

    # Check if 15 days have passed since program completion
    days_since_completion = (datetime.utcnow() - progress.completed_at).days
    if days_since_completion < 15:
        raise HTTPException(
            status_code=403,
            detail=f"Retention quiz unlocks 15 days after program completion. {15 - days_since_completion} days remaining.",
        )

    # Get questions and correct answers
    questions = (
        db.query(RetentionQuizQuestion)
        .filter(
            RetentionQuizQuestion.retention_quiz_id
            == request.retention_quiz_id
        )
        .all()
    )
    total_questions = len(questions)
    correct_count = 0

    # Calculate score
    questions_dict = {q.id: q for q in questions}

    question_results = []

    for question in questions:
        submitted_answer = next(
            (
                answer.get("selected_option")
                for answer in request.answers
                if answer.get("question_id") == question.id
            ),
            None,
        )

        correct_answer = question.correct_answer

        # Short Answer and Paragraph are reflection questions.
        # Any non-empty answer is accepted.
        if question.response_format in ["Short Answer", "Paragraph"]:
            selected_option = submitted_answer

            is_correct = (
                submitted_answer is not None
                and str(submitted_answer).strip() != ""
            )

        else:
            # Option questions use the configured correct answer.
            option_map = {
                "A": question.option_a,
                "B": question.option_b,
                "C": question.option_c,
                "D": question.option_d,
            }

            selected_option = submitted_answer

            # Convert answer text to A/B/C/D if frontend sends answer text
            if submitted_answer in option_map.values():
                for key, value in option_map.items():
                    if submitted_answer == value:
                        selected_option = key
                        break

            is_correct = (
                selected_option is not None
                and selected_option == correct_answer
            )

         # DEBUG RETENTION QUIZ
        print("===== RETENTION QUIZ DEBUG =====")
        print("Question ID:", question.id)
        print("Submitted:", repr(submitted_answer))
        print("Correct:", repr(correct_answer))
        print("Selected Option:", repr(selected_option))
        print("Match:", selected_option == correct_answer)
        print("--------------------------------")


        

        if is_correct:
            correct_count += 1

        question_results.append({
            "question_id": question.id,
            "question": question.question,
            "selected_answer": selected_option,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "response_format": question.response_format,
            "option_a": question.option_a,
            "option_b": question.option_b,
            "option_c": question.option_c,
            "option_d": question.option_d,
        })

    score = (
        int((correct_count / total_questions) * 100)
        if total_questions > 0
        else 0
    )

    passed = score >= 40

    attempt = RetentionQuizAttempt(
        user_id=request.user_id,
        retention_quiz_id=request.retention_quiz_id,
        score=correct_count,
        total_questions=total_questions,
        total_marks=correct_count,
        percentage=score,
        passed=passed,
        attempt_number=request.attempt_number,
        answers=request.answers,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)



    print("===== RETENTION ATTEMPT SAVED =====")
    print("Attempt ID:", attempt.id)
    print("User ID:", attempt.user_id)
    print("Retention Quiz ID:", attempt.retention_quiz_id)
    print("Score:", attempt.score)
    print("Percentage:", attempt.percentage)
    print("==================================")
    

    # Award curos if passed
    if passed and retention_quiz.curos > 0:
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if user:
            user.curos = (user.curos or 0) + retention_quiz.curos
            db.add(user)
            db.commit()


    # Update learning streak
    update_learning_streak(request.user_id, db)

    # ==========================================
    # RETENTION QUIZ RESULT NOTIFICATIONS
    # ==========================================

    user = db.query(User).filter(
        User.user_id == request.user_id
    ).first()

    learner_name = (
        user.full_name
        if user and user.full_name
        else f"User {request.user_id}"
    )

    program_name = program.name if program else "Program"


    # ==========================================
    # PASSED
    # ==========================================
    if passed:

        # Notify Admin / Master Admin
        try:
            create_admin_notification(
                db=db,
                message=(
                    f"{learner_name} passed the Retention Quiz "
                    f"for program '{program_name}' "
                    f"with a score of {score}%."
                ),
                title="Retention Quiz Passed",
                program_id=program.id,
            )
        except Exception as e:
            print(f"Failed to create admin notification: {e}")


        # Notify learner
        try:
            create_retention_quiz_completion_notification(
                db=db,
                user_id=request.user_id,
                quiz_id=request.retention_quiz_id,
            )
        except Exception as e:
            print(f"Failed to create learner notification: {e}")


        # Send passed email
        try:
            if user and user.email:
                send_notification_email(
                    to_email=user.email,
                    title="Retention Quiz Passed",
                    message=(
                        f"Congratulations! You passed the Retention Quiz "
                        f"for '{program_name}' with a score of {score}%. "
                        f"You can now view your result."
                    ),
                )
        except Exception as e:
            print(f"Failed to send passed email: {e}")


    # ==========================================
    # FAILED
    # ==========================================
    else:

        # Notify learner that they failed and can reattempt
        try:
            create_retention_quiz_failed_notification(
                db=db,
                user_id=request.user_id,
                quiz_id=request.retention_quiz_id,
                program_name=program_name,
            )
        except Exception as e:
            print(f"Failed to create failed Retention Quiz notification: {e}")


        # Send failed email
        try:
            if user and user.email:
                send_notification_email(
                    to_email=user.email,
                    title="Retention Quiz Reattempt Required",
                    message=(
                        f"You did not pass the Retention Quiz for "
                        f"'{program_name}' this time. "
                        f"Your score was {score}%. "
                        f"The passing score is 40%. "
                        f"Please reattempt the Retention Quiz."
                    ),
                )
        except Exception as e:
            print(f"Failed to send failed email: {e}")

    # IMPORTANT: save the notifications
    db.commit()


    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "retention_quiz_id": attempt.retention_quiz_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "passed": attempt.passed,
        "attempt_number": attempt.attempt_number,
        "answers": attempt.answers,
        "attempted_at": attempt.attempted_at,
        "question_results": question_results,
    }    
@router.get("/retention-quiz/{quiz_id}")
def get_retention_quiz_for_attempt(
    quiz_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get retention quiz with questions for an eligible learner."""

    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(RetentionQuiz.id == quiz_id)
        .first()
    )

    if not retention_quiz:
        raise HTTPException(
            status_code=404,
            detail="Retention quiz not found"
        )

    # ==========================================
    # GET PROGRAM
    # ==========================================

    program = (
        db.query(Program)
        .filter(Program.id == retention_quiz.program_id)
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    # ==========================================
    # CHECK PROGRAM COMPLETION
    # ==========================================

    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program.id,
            UserProgramProgress.completed == True,
            UserProgramProgress.completed_at.isnot(None),
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=403,
            detail="You must complete the program before accessing the retention quiz."
        )

    # ==========================================
    # CHECK RETENTION QUIZ UNLOCK
    # ==========================================

    required_days = 0

    days_since_completion = (
        datetime.utcnow() - progress.completed_at
    ).days

    if days_since_completion < required_days:
        days_remaining = required_days - days_since_completion

        raise HTTPException(
            status_code=403,
            detail=(
                f"Retention quiz unlocks {required_days} days "
                f"after program completion. "
                f"{days_remaining} days remaining."
            )
        )

    # ==========================================
    # CHECK IF ALREADY COMPLETED
    # ==========================================

    # Check if learner has already PASSED the Retention Quiz
    passed_attempt = (
        db.query(RetentionQuizAttempt)
        .filter(
            RetentionQuizAttempt.user_id == user_id,
            RetentionQuizAttempt.retention_quiz_id == quiz_id,
            RetentionQuizAttempt.passed == True,
        )
        .order_by(
            RetentionQuizAttempt.attempted_at.desc()
        )
        .first()
    )

    if passed_attempt:
        raise HTTPException(
            status_code=403,
            detail="You have already passed the retention quiz."
        )

    # ==========================================
    # GET QUESTIONS
    # ==========================================

    questions = (
        db.query(RetentionQuizQuestion)
        .filter(
            RetentionQuizQuestion.retention_quiz_id == quiz_id
        )
        .order_by(
            RetentionQuizQuestion.display_order
        )
        .all()
    )

    return {
        "id": retention_quiz.id,
        "program_id": retention_quiz.program_id,
        "questions": questions,
        "retention_quiz_id": quiz_id,
    }


@router.get("/retention-quiz/{quiz_id}/result")
def get_retention_quiz_result(
    quiz_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get the completed retention quiz result for a learner."""

    # Get the latest completed attempt
    attempt = (
        db.query(RetentionQuizAttempt)
        .filter(
            RetentionQuizAttempt.user_id == user_id,
            RetentionQuizAttempt.retention_quiz_id == quiz_id
        )
        .order_by(
            RetentionQuizAttempt.attempted_at.desc(),
            RetentionQuizAttempt.id.desc()
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="No retention quiz result found."
        )

    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(RetentionQuiz.id == quiz_id)
        .first()
    )

    if not retention_quiz:
        raise HTTPException(
            status_code=404,
            detail="Retention quiz not found."
        )

    # Get all questions
    questions = (
        db.query(RetentionQuizQuestion)
        .filter(
            RetentionQuizQuestion.retention_quiz_id == quiz_id
        )
        .order_by(
            RetentionQuizQuestion.display_order
        )
        .all()
    )

    saved_answers = attempt.answers or []

    question_results = []

    correct_count = 0

    for question in questions:

        # Find learner's submitted answer
        submitted_answer = next(
            (
                answer.get("selected_option")
                for answer in saved_answers
                if answer.get("question_id") == question.id
            ),
            None
        )

        # Correct answer
        correct_answer = question.correct_answer

        # Short Answer and Paragraph are reflection questions.
        # Any non-empty answer is accepted.
        if question.response_format in ["Short Answer", "Paragraph"]:
            is_correct = (
                submitted_answer is not None
                and str(submitted_answer).strip() != ""
            )

        else:
            # Option / Checkbox questions use the configured correct answer.
            option_map = {
                "A": question.option_a,
                "B": question.option_b,
                "C": question.option_c,
                "D": question.option_d,
            }

            selected_option = submitted_answer

            # Convert answer text to A/B/C/D if necessary
            if submitted_answer in option_map.values():
                for key, value in option_map.items():
                    if submitted_answer == value:
                        selected_option = key
                        break

            is_correct = (
                selected_option is not None
                and selected_option == correct_answer
            )

        if is_correct:
            correct_count += 1

        question_results.append({
            "question_id": question.id,
            "question": question.question,
            "selected_answer": submitted_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "response_format": question.response_format,
            "option_a": question.option_a,
            "option_b": question.option_b,
            "option_c": question.option_c,
            "option_d": question.option_d,
        })

    total_questions = len(questions)
    wrong_count = total_questions - correct_count

    percentage = (
        int((correct_count / total_questions) * 100)
        if total_questions > 0
        else 0
    )

    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "retention_quiz_id": attempt.retention_quiz_id,
        "program_id": retention_quiz.program_id,

        "total_questions": total_questions,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "score": correct_count,
        "percentage": percentage,
        "attempt_number": attempt.attempt_number,
        "attempted_at": attempt.attempted_at,
        "question_results": question_results
    }

# ==========================================
# APPLICATION CHECK ATTEMPTS
# ==========================================


@router.post("/application-check/attempt")
def create_application_check_attempt(
    request: ApplicationCheckAttemptCreate, db: Session = Depends(get_db)
):
    """Record an application check attempt."""
    application_check = (
        db.query(ApplicationCheck)
        .filter(ApplicationCheck.id == request.application_check_id)
        .first()
    )
    if not application_check:
        raise HTTPException(status_code=404, detail="Application check not found")

    # Check if user has completed the program
    program = (
        db.query(Program)
        .filter(Program.id == application_check.program_id)
        .first()
    )
    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    # Get Application Check automation setting
    automation_setting = (
        db.query(ApplicationCheckAutomationSetting)
        .first()
    )

    automation_enabled = (
        automation_setting.is_enabled
        if automation_setting
        else False
    )
    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == request.user_id,
            UserProgramProgress.program_id == program.id,
            UserProgramProgress.completed == True,
            UserProgramProgress.completed_at.isnot(None),
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=403,
            detail="You must complete the program before attempting the application check",
        )

    # Check if required days have passed since program completion using database field with fallback
    fallback_unlock_days = {1: 30, 2: 60, 3: 90}
    required_days = application_check.unlock_after_days
    if required_days is None:
        required_days = fallback_unlock_days.get(
            application_check.check_number, 30
        )

    days_since_completion = (datetime.utcnow() - progress.completed_at).days
    #if days_since_completion < required_days:
        #raise HTTPException(
            #status_code=403,
            #detail=f"Application Check {application_check.check_number} unlocks {required_days} days after program completion. {required_days - days_since_completion} days remaining.",
       # )

    # ==========================================
    # PREVENT DUPLICATE APPLICATION CHECK
    # ==========================================

    existing_app_progress = (
        db.query(UserApplicationCheckProgress)
        .filter(
            UserApplicationCheckProgress.user_id == request.user_id,
            UserApplicationCheckProgress.program_id == program.id,
            UserApplicationCheckProgress.application_check_id
            == application_check.id,
        )
        .first()
    )

    if existing_app_progress:
        if existing_app_progress.status in [
            "Pending Review",
            "Approved"
        ]:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Application Check "
                    f"{application_check.check_number} "
                    f"has already been submitted."
                )
            )

    # Get questions
    questions = (
        db.query(ApplicationCheckQuestion)
        .filter(
            ApplicationCheckQuestion.application_check_id
            == request.application_check_id
        )
        .all()
    )
    total_questions = len(questions)

    # Calculate completion based on answered questions
    answered_count = len(
        [
            a
            for a in request.answers
            if a.get("answer") and a.get("answer").strip()
        ]
    )
    percentage = (
        int((answered_count / total_questions) * 100)
        if total_questions > 0
        else 0
    )
    passed = percentage >= 70

    attempt = ApplicationCheckAttempt(
        user_id=request.user_id,
        application_check_id=request.application_check_id,
        score=answered_count,
        total_questions=total_questions,
        total_marks=answered_count,
        percentage=percentage,
        passed=passed,
        attempt_number=request.attempt_number,
        answers=request.answers,
    )

    db.add(attempt)
    db.flush()

    # Create or update UserApplicationCheckProgress to "Pending Review"
    app_progress = (
        db.query(UserApplicationCheckProgress)
        .filter(
            UserApplicationCheckProgress.user_id == request.user_id,
            UserApplicationCheckProgress.program_id == program.id,
            UserApplicationCheckProgress.application_check_id
            == application_check.id,
        )
        .first()
    )

    if not app_progress:
        app_progress = UserApplicationCheckProgress(
            user_id=request.user_id,
            program_id=program.id,
            application_check_id=application_check.id,
            status="Pending Review" if not automation_enabled else (
                "Approved" if passed else "Rejected"
            ),
            completed_at=datetime.utcnow(),
        )
        db.add(app_progress)
    else:
        app_progress.status = (
            "Pending Review"
            if not automation_enabled
            else ("Approved" if passed else "Rejected")
        )
        app_progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(attempt)

    # Award curos if passed
    if passed and (application_check.curos or 0) > 0:
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if user:
            user.curos = (user.curos or 0) + application_check.curos
            db.add(user)
            db.commit()

    # Update learning streak
    update_learning_streak(request.user_id, db)

    # ==========================================
    # APPLICATION CHECK NOTIFICATIONS
    # ==========================================

    user = (
        db.query(User)
        .filter(User.user_id == request.user_id)
        .first()
    )

    learner_name = (
        user.full_name
        if user and user.full_name
        else f"User {request.user_id}"
    )

    program_name = (
        program.name
        if program and program.name
        else "Program"
    )


    # ==========================================
    # MANUAL MODE
    # LEARNER → WEBSITE + EMAIL UNDER REVIEW
    # ADMINS → WEBSITE + EMAIL REVIEW REQUEST
    # ==========================================

    if not automation_enabled:

        try:

            learner_notification = UserNotification(
                user_id=request.user_id,
                program_id=program.id,
                application_check_id=application_check.id,
                title="Application Check Under Review",
                message=(
                    f"Your Application Check "
                    f"{application_check.check_number} for "
                    f"'{program_name}' has been submitted successfully "
                    f"and is now under review."
                ),
                notification_type="application_check",
            )

            db.add(learner_notification)


            admins = (
                db.query(User)
                .filter(
                    User.is_active == True,
                    User.role_id.in_([1, 2]),
                )
                .all()
            )


            for admin in admins:

                admin_notification = UserNotification(
                    user_id=admin.user_id,
                    program_id=program.id,
                    application_check_id=application_check.id,
                    title="Application Check Submitted",
                    message=(
                        f"{learner_name} completed Application Check "
                        f"{application_check.check_number} for "
                        f"'{program_name}'. Please review the submission."
                    ),
                    notification_type="application_check",
                )

                db.add(admin_notification)


            # Save website notifications
            db.commit()


            # Send email to learner
            if user and user.email:

                try:

                    send_notification_email(
                        to_email=user.email,
                        title=learner_notification.title,
                        message=learner_notification.message,
                    )

                except Exception as email_error:

                    print(
                        f"Failed to send email to learner: "
                        f"{email_error}"
                    )


            # Send email to all admins
            for admin in admins:

                if admin.email:

                    try:

                        send_notification_email(
                            to_email=admin.email,
                            title="Application Check Submitted",
                            message=(
                                f"{learner_name} completed Application Check "
                                f"{application_check.check_number} for "
                                f"'{program_name}'. Please review the submission."
                            ),
                        )

                    except Exception as email_error:

                        print(
                            f"Failed to send email to admin "
                            f"{admin.user_id}: {email_error}"
                        )


        except Exception as e:

            db.rollback()

            print(
                f"Failed to create manual Application Check "
                f"notifications: {e}"
            )


    # ==========================================
    # AUTOMATED MODE
    # LEARNER → WEBSITE + EMAIL APPROVED/REJECTED
    # ==========================================

    else:

        if passed:

            notification_title = "Application Check Approved"

            notification_message = (
                f"Your Application Check "
                f"{application_check.check_number} for "
                f"'{program_name}' has been approved."
            )

        else:

            notification_title = "Application Check Rejected"

            notification_message = (
                f"Your Application Check "
                f"{application_check.check_number} for "
                f"'{program_name}' was rejected. "
                f"Please reattempt the Application Check."
            )


        try:

            learner_notification = UserNotification(
                user_id=request.user_id,
                program_id=program.id,
                application_check_id=application_check.id,
                title=notification_title,
                message=notification_message,
                notification_type="application_check",
            )

            db.add(learner_notification)

            # Save website notification
            db.commit()


            # Send email to learner
            if user and user.email:

                try:

                    send_notification_email(
                        to_email=user.email,
                        title=notification_title,
                        message=notification_message,
                    )

                except Exception as email_error:

                    print(
                        f"Failed to send Application Check "
                        f"email to learner: {email_error}"
                    )


        except Exception as e:

            db.rollback()

            print(
                f"Failed to create automated Application Check "
                f"notification: {e}"
            )

    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "application_check_id": attempt.application_check_id,
        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "passed": attempt.passed,
        "attempt_number": attempt.attempt_number,
        "answers": attempt.answers,
        "attempted_at": attempt.attempted_at,
        "check_number": application_check.check_number,
        "program_id": program.id,
        "status": "Pending Review",
    }

# ==========================================
# GET APPLICATION CHECK RESULT
# ==========================================

@router.get("/application-check/{check_id}/result")
def get_application_check_result(
    check_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    # Get Application Check
    application_check = (
        db.query(ApplicationCheck)
        .filter(ApplicationCheck.id == check_id)
        .first()
    )

    if not application_check:
        raise HTTPException(
            status_code=404,
            detail="Application Check not found."
        )

    # Get latest attempt for this learner
    attempt = (
        db.query(ApplicationCheckAttempt)
        .filter(
            ApplicationCheckAttempt.user_id == user_id,
            ApplicationCheckAttempt.application_check_id == check_id
        )
        .order_by(
            ApplicationCheckAttempt.attempted_at.desc(),
            ApplicationCheckAttempt.id.desc()
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="No Application Check result found."
        )

    # Get learner's review status
    progress = (
        db.query(UserApplicationCheckProgress)
        .filter(
            UserApplicationCheckProgress.user_id == user_id,
            UserApplicationCheckProgress.application_check_id == check_id
        )
        .first()
    )

    # Get questions
    questions = (
        db.query(ApplicationCheckQuestion)
        .filter(
            ApplicationCheckQuestion.application_check_id == check_id
        )
        .order_by(ApplicationCheckQuestion.id)
        .all()
    )

    saved_answers = attempt.answers or []

    question_results = []

    for question in questions:

        submitted_answer = next(
            (
                answer.get("answer")
                for answer in saved_answers
                if answer.get("question_id") == question.id
            ),
            None
        )

        question_results.append(
            {
                "question_id": question.id,
                "question": question.question,
                "submitted_answer": submitted_answer,
            }
        )

    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "application_check_id": attempt.application_check_id,
        "program_id": application_check.program_id,
        "check_number": application_check.check_number,

        "score": attempt.score,
        "total_questions": attempt.total_questions,
        "total_marks": attempt.total_marks,
        "percentage": attempt.percentage,
        "passed": attempt.passed,
        "attempt_number": attempt.attempt_number,
        "attempted_at": attempt.attempted_at,

        "status": (
            progress.status
            if progress
            else "Submitted"
        ),

        "question_results": question_results,
    }

@router.get("/application-check/{check_id}")
def get_application_check_for_attempt(
    check_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get application check with questions for an eligible learner."""

    # ==========================================
    # GET APPLICATION CHECK
    # ==========================================

    application_check = (
        db.query(ApplicationCheck)
        .filter(ApplicationCheck.id == check_id)
        .first()
    )

    if not application_check:
        raise HTTPException(
            status_code=404,
            detail="Application check not found"
        )

    # ==========================================
    # GET PROGRAM
    # ==========================================

    program = (
        db.query(Program)
        .filter(Program.id == application_check.program_id)
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found"
        )

    # ==========================================
    # CHECK PROGRAM COMPLETION
    # ==========================================

    progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program.id,
            UserProgramProgress.completed == True,
            UserProgramProgress.completed_at.isnot(None),
        )
        .first()
    )

    if not progress:
        raise HTTPException(
            status_code=403,
            detail="You must complete the program before accessing the application check."
        )

    # ==========================================
    # CHECK UNLOCK DAYS
    # ==========================================

    fallback_unlock_days = {
        1: 30,
        2: 60,
        3: 90,
    }

    required_days = application_check.unlock_after_days

    if required_days is None:
        required_days = fallback_unlock_days.get(
            application_check.check_number,
            30
        )

    days_since_completion = (
        datetime.utcnow() - progress.completed_at
    ).days

    if days_since_completion < required_days:

        days_remaining = (
            required_days - days_since_completion
        )

        raise HTTPException(
            status_code=403,
            detail=(
                f"Application Check "
                f"{application_check.check_number} "
                f"unlocks {required_days} days after "
                f"program completion. "
                f"{days_remaining} days remaining."
            )
        )

    # ==========================================
    # CHECK EXISTING SUBMISSION
    # ==========================================

    existing_app_progress = (
        db.query(UserApplicationCheckProgress)
        .filter(
            UserApplicationCheckProgress.user_id == user_id,
            UserApplicationCheckProgress.program_id == program.id,
            UserApplicationCheckProgress.application_check_id
            == application_check.id,
        )
        .first()
    )

    if existing_app_progress:

        if existing_app_progress.status in [
            "Pending Review",
            "Approved",
        ]:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Application Check "
                    f"{application_check.check_number} "
                    f"has already been submitted."
                )
            )

    # ==========================================
    # GET QUESTIONS
    # ==========================================

    questions = (
        db.query(ApplicationCheckQuestion)
        .filter(
            ApplicationCheckQuestion.application_check_id
            == check_id
        )
        .order_by(
            ApplicationCheckQuestion.display_order
        )
        .all()
    )

    return {
        "id": application_check.id,
        "program_id": application_check.program_id,
        "check_number": application_check.check_number,
        "questions": questions,
    }

# ==========================================
# AVAILABLE QUIZZES FOR USER
# ==========================================


@router.get("/available-quizzes/{user_id}")
def get_available_quizzes_for_user(user_id: int, db: Session = Depends(get_db)):
    """Get all available retention quizzes and application checks for a user based on completed programs."""

    # Get all completed programs for the user
    completed_programs = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.completed == True,
            UserProgramProgress.completed_at.isnot(None),
        )
        .all()
    )

    available_quizzes = []

    for progress in completed_programs:
        program = (
            db.query(Program).filter(Program.id == progress.program_id).first()
        )
        if not program:
            continue

        days_since_completion = (
            datetime.utcnow() - progress.completed_at
        ).days

        # Check retention quiz
        retention_quiz = (
            db.query(RetentionQuiz)
            .filter(RetentionQuiz.program_id == program.id)
            .first()
        )

        if retention_quiz:
            # Check if user has already attempted this quiz
            existing_attempt = (
                db.query(RetentionQuizAttempt)
                .filter(
                    RetentionQuizAttempt.user_id == user_id,
                    RetentionQuizAttempt.retention_quiz_id
                    == retention_quiz.id,
                )
                .first()
            )

            # Hardcoded: Retention quiz unlocks after 15 days of program completion
            is_available = days_since_completion >= 15

            if not existing_attempt and is_available:
                available_quizzes.append(
                    AvailableQuizResponse(
                        type="retention_quiz",
                        id=retention_quiz.id,
                        program_id=program.id,
                        program_name=program.name,
                        title="Retention Quiz",
                        check_number=None,
                        days_since_completion=days_since_completion,
                        is_available=True,
                    )
                )

        # Check application checks
        application_checks = (
            db.query(ApplicationCheck)
            .filter(ApplicationCheck.program_id == program.id)
            .order_by(ApplicationCheck.check_number)
            .all()
        )

        for app_check in application_checks:
            # Check existing UserApplicationCheckProgress status
            existing_app_progress = (
                db.query(UserApplicationCheckProgress)
                .filter(
                    UserApplicationCheckProgress.user_id == user_id,
                    UserApplicationCheckProgress.application_check_id
                    == app_check.id,
                )
                .first()
            )

            # Skip if already approved or pending review
            if existing_app_progress and existing_app_progress.status in [
                "Approved",
                "Pending Review",
            ]:
                continue

            # Use database unlock_after_days with fallback
            fallback_unlock_days = {1: 30, 2: 60, 3: 90}
            required_days = app_check.unlock_after_days
            if required_days is None:
                required_days = fallback_unlock_days.get(
                    app_check.check_number, 30
                )

            is_available = days_since_completion >= required_days

            if is_available:
                available_quizzes.append(
                    AvailableQuizResponse(
                        type="application_check",
                        id=app_check.id,
                        program_id=program.id,
                        program_name=program.name,
                        title=f"Application Check {app_check.check_number}",
                        check_number=app_check.check_number,
                        days_since_completion=days_since_completion,
                        is_available=True,
                    )
                )

    return available_quizzes

# ==========================================
# PROGRAM MILESTONES STATUS
# ==========================================

@router.get("/program-milestones/{user_id}/{program_id}")
def get_program_milestones(
    user_id: int,
    program_id: int,
    db: Session = Depends(get_db)
):
    """
    Get Retention Quiz and Application Check status
    for a specific learner and program.

    Unlock rules:
    - Retention Quiz: 15 days after program completion
    - Application Check 1: 30 days
    - Application Check 2: 60 days
    - Application Check 3: 90 days
    """

    # ==========================================
    # GET PROGRAM PROGRESS
    # ==========================================

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
            status_code=404,
            detail="Program progress not found"
        )

    # ==========================================
    # PROGRAM NOT COMPLETED
    # ==========================================

    if not progress.completed or not progress.completed_at:
        return {
            "program_id": program_id,
            "program_completed": False,
            "completed_at": None,
            "days_since_completion": 0,
            "retention_quiz": None,
            "application_checks": [],
        }

    # ==========================================
    # CALCULATE DAYS
    # ==========================================

    days_since_completion = (
        datetime.utcnow() - progress.completed_at
    ).days

    # ==========================================
    # RETENTION QUIZ
    # ==========================================

    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(
            RetentionQuiz.program_id == program_id
        )
        .first()
    )

    retention_result = None

    if retention_quiz:

        retention_attempt = (
            db.query(RetentionQuizAttempt)
            .filter(
                RetentionQuizAttempt.user_id == user_id,
                RetentionQuizAttempt.retention_quiz_id
                == retention_quiz.id,
            )
            .order_by(
                RetentionQuizAttempt.attempted_at.desc()
            )
            .first()
        )

        required_days = 15
        is_unlocked = (
            days_since_completion >= required_days
        )

        retention_result = {
            "id": retention_quiz.id,
            "title": "Retention Quiz",
            "required_days": required_days,
            "days_since_completion": days_since_completion,
            "days_remaining": max(
                required_days - days_since_completion,
                0
            ),
            "is_unlocked": is_unlocked,

            # Completed ONLY when the learner PASSED
            "is_completed": (
                retention_attempt is not None
                and retention_attempt.passed is True
            ),

            # Failed attempt → learner can reattempt
            "can_reattempt": (
                retention_attempt is not None
                and retention_attempt.passed is False
                and is_unlocked
            ),

            "status": (
                "Completed"
                if retention_attempt and retention_attempt.passed
                else (
                    "Reattempt"
                    if retention_attempt and not retention_attempt.passed
                    else (
                        "Available"
                        if is_unlocked
                        else "Locked"
                    )
                )
            ),

            "latest_attempt_passed": (
                retention_attempt.passed
                if retention_attempt
                else None
            ),
        }
    # ==========================================
    # APPLICATION CHECKS
    # ==========================================

    application_checks = (
        db.query(ApplicationCheck)
        .filter(
            ApplicationCheck.program_id == program_id
        )
        .order_by(
            ApplicationCheck.check_number
        )
        .all()
    )

    application_results = []

    fallback_unlock_days = {
        1: 30,
        2: 60,
        3: 90,
    }

    for app_check in application_checks:

        required_days = app_check.unlock_after_days

        if required_days is None:
            required_days = fallback_unlock_days.get(
                app_check.check_number,
                30
            )

        # ------------------------------------------
        # GET USER PROGRESS
        # ------------------------------------------

        app_progress = (
            db.query(UserApplicationCheckProgress)
            .filter(
                UserApplicationCheckProgress.user_id == user_id,
                UserApplicationCheckProgress.program_id == program_id,
                UserApplicationCheckProgress.application_check_id
                == app_check.id,
            )
            .first()
        )

        status = (
            app_progress.status
            if app_progress
            else "Locked"
        )

       # Application Check unlock based on required days
        is_unlocked = (
            days_since_completion >= required_days
        )

        # Don't overwrite actual review status
        if app_progress:
            display_status = app_progress.status
        elif is_unlocked:
            display_status = "Available"
        else:
            display_status = "Locked"

        application_results.append({
    "id": app_check.id,
    "check_number": app_check.check_number,
    "title": f"Application Check {app_check.check_number}",
    "required_days": required_days,
    "days_since_completion": days_since_completion,
    "days_remaining": max(
        required_days - days_since_completion,
        0
    ),
    "is_unlocked": is_unlocked,
    "status": display_status,
    "review_comment": app_progress.review_comment if app_progress else None,
})

    # ==========================================
    # RETURN
    # ==========================================

    return {
        "program_id": program_id,
        "program_completed": True,
        "completed_at": progress.completed_at,
        "days_since_completion": days_since_completion,
        "retention_quiz": retention_result,
        "application_checks": application_results,
    }

@router.get("/all-quizzes/{user_id}")
def get_all_quizzes_for_testing(user_id: int, db: Session = Depends(get_db)):
    """TESTING ENDPOINT: Get ALL retention quizzes and application checks from database.

    Bypasses program completion and attempt checking logic for testing purposes.
    Still respects hardcoded/DB unlock timings (15 days for retention,
    unlock_after_days for app checks).
    """
    all_quizzes = []

    # Get ALL retention quizzes from database
    retention_quizzes = db.query(RetentionQuiz).all()

    for retention_quiz in retention_quizzes:
        # Get program info
        program = (
            db.query(Program)
            .filter(Program.id == retention_quiz.program_id)
            .first()
        )
        program_name = program.name if program else "Unknown Program"

        # Hardcoded: Retention quiz unlocks after 15 days
        all_quizzes.append(
            AvailableQuizResponse(
                type="retention_quiz",
                id=retention_quiz.id,
                program_id=retention_quiz.program_id,
                program_name=program_name,
                title="Retention Quiz",
                check_number=None,
                days_since_completion=0,
                is_available=False,  # Testing endpoint: shows as locked since days_since_completion=0
            )
        )

    # Get ALL application checks from database
    application_checks = (
        db.query(ApplicationCheck)
        .order_by(ApplicationCheck.check_number)
        .all()
    )

    for app_check in application_checks:
        # Get program info
        program = (
            db.query(Program).filter(Program.id == app_check.program_id).first()
        )
        program_name = program.name if program else "Unknown Program"

        all_quizzes.append(
            AvailableQuizResponse(
                type="application_check",
                id=app_check.id,
                program_id=app_check.program_id,
                program_name=program_name,
                title=f"Application Check {app_check.check_number}",
                check_number=app_check.check_number,
                days_since_completion=0,
                is_available=False,  # Testing endpoint: shows as locked since days_since_completion=0
            )
        )

    return all_quizzes


@router.get("/next-module/{user_id}/{program_id}")
def get_next_module_to_unlock(
    user_id: int, program_id: int, db: Session = Depends(get_db)
):
    """Get the next module that should be unlocked for a user in a program.

    Returns the first incomplete module, or None if all modules are completed.
    """
    # Get completed modules efficiently
    completed_modules = (
        db.query(ModuleCompletion.module_id)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.program_id == program_id,
            ModuleCompletion.is_completed == True,
        )
        .all()
    )
    completed_module_ids = [cm[0] for cm in completed_modules]

    # Get all modules in order (optimized selection)
    all_modules = (
        db.query(
            Module.id, Module.title, Module.description, Module.module_order
        )
        .filter(Module.program_id == program_id)
        .order_by(Module.module_order)
        .all()
    )

    # Find first incomplete module
    next_module = None
    for module in all_modules:
        if module.id not in completed_module_ids:
            next_module = {
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "module_order": module.module_order,
            }
            break

    return {
        "next_module": next_module,
        "all_modules_completed": next_module is None,
        "completed_count": len(completed_module_ids),
        "total_count": len(all_modules),
    }


@router.post("/force-module-complete")
def force_module_complete(
    user_id: int,
    module_id: int,
    program_id: int,
    db: Session = Depends(get_db),
):
    """Force mark a module as complete (for testing purposes).

    This bypasses the content completion check.
    """
    print(f"=== FORCE MODULE COMPLETION ===")
    print(
        f"User ID: {user_id}, Module ID: {module_id}, Program ID: {program_id}"
    )

    # Get or create module completion
    module_completion = (
        db.query(ModuleCompletion)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.module_id == module_id,
        )
        .first()
    )

    if not module_completion:
        print(
            f"Creating new ModuleCompletion for user {user_id}, module {module_id}"
        )
        module_completion = ModuleCompletion(
            user_id=user_id,
            module_id=module_id,
            program_id=program_id,
            is_completed=False,
            progress_percentage=0,
            completed_modules=[],
        )
        db.add(module_completion)
        db.flush()

    if not module_completion.is_completed:
        print("Setting module as completed")
        module_completion.is_completed = True
        module_completion.completed_at = datetime.utcnow()
        module_completion.progress_percentage = 100
        module_completion.completed_modules = [module_id]
        module_completion.updated_at = datetime.utcnow()
        db.commit()
        print("Module completion saved to database")

        # Update program progress
        update_program_progress_after_module_completion(
            user_id, program_id, db
        )
        print("Program progress updated")

        # Log the completion for debugging
        print(
            f"Module {module_id} force marked as completed for user {user_id}"
        )
    else:
        print("Module was already marked as completed")

    return {
        "success": True,
        "module_id": module_id,
        "user_id": user_id,
        "is_completed": module_completion.is_completed,
    }


@router.get("/next-content/{user_id}/{module_id}")
def get_next_incomplete_content(
    user_id: int, module_id: int, db: Session = Depends(get_db)
):
    """Get the next incomplete content item in a module.

    Returns the first content item that hasn't been completed yet.
    """
    print(f"=== GETTING NEXT INCOMPLETE CONTENT ===")
    print(f"User ID: {user_id}, Module ID: {module_id}")

    # Load the module with all its content
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        print(f"ERROR: Module {module_id} not found!")
        return {"next_content": None, "all_completed": False}

    print(f"Module found: {module.title} (ID: {module.id})")

    # Get all content items in the module, sorted by content_order
    all_content = []

    # Add videos
    for video in module.videos or []:
        all_content.append(
            {
                "id": video.id,
                "type": "video",
                "title": video.title,
                "content_order": video.content_order or 0,
            }
        )

    # Add quizzes
    for quiz in module.quizzes or []:
        all_content.append(
            {
                "id": quiz.id,
                "type": "quiz",
                "title": quiz.title,
                "content_order": quiz.content_order or 0,
            }
        )

    # Add written lessons
    for lesson in module.written_lessons or []:
        all_content.append(
            {
                "id": lesson.id,
                "type": "written_lesson",
                "title": lesson.title,
                "content_order": lesson.content_order or 0,
            }
        )

    # Add surveys
    for survey in module.survey_forms or []:
        all_content.append(
            {
                "id": survey.id,
                "type": "survey",
                "title": survey.title,
                "content_order": survey.content_order or 0,
            }
        )

    # Add assignments
    for assignment in module.assignments or []:
        all_content.append(
            {
                "id": assignment.assignment_id,
                "type": "assignment",
                "title": assignment.title,
                "content_order": 0,  # Assignments might not have content_order
            }
        )

    # Sort by content_order
    all_content.sort(key=lambda x: x["content_order"])

    print(f"Total content items in module: {len(all_content)}")

    # Bulk resolve N+1 Queries logic completely:
    video_ids = [c["id"] for c in all_content if c["type"] == "video"]
    lesson_ids = [c["id"] for c in all_content if c["type"] == "written_lesson"]
    survey_ids = [c["id"] for c in all_content if c["type"] == "survey"]
    assignment_ids = [c["id"] for c in all_content if c["type"] == "assignment"]

    completed_videos = (
        {
            v[0]
            for v in db.query(VideoCompletion.video_id)
            .filter(
                VideoCompletion.user_id == user_id,
                VideoCompletion.video_id.in_(video_ids),
                VideoCompletion.is_completed == True,
            )
            .all()
        }
        if video_ids
        else set()
    )

    completed_lessons = (
        {
            l[0]
            for l in db.query(WrittenLessonCompletion.lesson_id)
            .filter(
                WrittenLessonCompletion.user_id == user_id,
                WrittenLessonCompletion.lesson_id.in_(lesson_ids),
                WrittenLessonCompletion.is_completed == True,
            )
            .all()
        }
        if lesson_ids
        else set()
    )

    completed_surveys = (
        {
            s[0]
            for s in db.query(SurveyCompletion.survey_id)
            .filter(
                SurveyCompletion.user_id == user_id,
                SurveyCompletion.survey_id.in_(survey_ids),
                SurveyCompletion.is_completed == True,
            )
            .all()
        }
        if survey_ids
        else set()
    )

    completed_assignments = (
        {
            a[0]
            for a in db.query(AssignmentSubmission.assignment_id)
            .filter(
                AssignmentSubmission.user_id == user_id,
                AssignmentSubmission.assignment_id.in_(assignment_ids),
                AssignmentSubmission.status == "Submitted",
            )
            .all()
        }
        if assignment_ids
        else set()
    )

    # Check each content item for completion
    for content in all_content:
        is_completed = False

        if content["type"] == "video":
            is_completed = content["id"] in completed_videos

        elif content["type"] == "quiz":
            attempt = (
                db.query(QuizAttempt)
                .filter(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.quiz_id == content["id"],
                )
                .order_by(QuizAttempt.attempted_at.desc())
                .first()
            )
            is_completed = attempt is not None and attempt.passed

        elif content["type"] == "written_lesson":
            is_completed = content["id"] in completed_lessons

        elif content["type"] == "survey":
            is_completed = content["id"] in completed_surveys

        elif content["type"] == "assignment":
            is_completed = content["id"] in completed_assignments

        print(
            f"Content {content['type']}-{content['id']}: {'COMPLETED' if is_completed else 'NOT COMPLETED'}"
        )

        if not is_completed:
            print(
                f"Found next incomplete content: {content['type']}-{content['id']}"
            )
            return {"next_content": content, "all_completed": False}

    # All content is completed
    print("All content in module is completed")
    return {"next_content": None, "all_completed": True}


def mark_module_complete(
    user_id: int, module_id: int, program_id: int, db: Session
):
    """Helper function to mark a module as complete in the database.

    Also awards module curos if this is the first time completing.
    """
    print(f"=== MARKING MODULE {module_id} AS COMPLETE ===")

    module_completion = (
        db.query(ModuleCompletion)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.module_id == module_id,
        )
        .first()
    )

    was_completed = False

    if not module_completion:
        print(
            f"Creating new ModuleCompletion for user {user_id}, module {module_id}"
        )
        module_completion = ModuleCompletion(
            user_id=user_id,
            module_id=module_id,
            program_id=program_id,
            is_completed=False,
            progress_percentage=0,
        )
        db.add(module_completion)
        db.flush()
    else:
        was_completed = module_completion.is_completed
        print(f"Existing ModuleCompletion found, was_completed: {was_completed}")

    if not module_completion.is_completed:
        print("Setting module as completed")
        module_completion.is_completed = True
        module_completion.completed_at = datetime.utcnow()
        module_completion.progress_percentage = 100
        module_completion.updated_at = datetime.utcnow()

        # AWARD MODULE CUROS
        module_curos = 0
        if not was_completed:
            print("=== AWARDING MODULE CUROS ===")
            module = db.query(Module).filter(Module.id == module_id).first()
            module_curos = module.curos if module else 0
            print(f"Module curos to award: {module_curos}")

            if module_curos > 0:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    old_curos = user.curos or 0
                    new_curos = old_curos + module_curos
                    print(f"User curos: {old_curos} → {new_curos}")
                    user.curos = new_curos
                    db.add(user)
                    print(
                        f"Awarded {module_curos} module curos to user {user_id}"
                    )
                else:
                    print(f"ERROR: User {user_id} not found!")
            else:
                print("Module has 0 curos, skipping award")
        else:
            print("Module already completed, skipping curos award")

        db.commit()
        print("Module completion saved to database")

        # Update program progress (this also awards program curos if applicable)
        update_program_progress_after_module_completion(
            user_id, program_id, db
        )
        print("Program progress updated")

        # Log the completion for debugging
        print(f"Module {module_id} marked as completed for user {user_id}")

        # Return success with module info for frontend
        return {
            "success": True,
            "module_id": module_id,
            "user_id": user_id,
            "is_completed": True,
            "program_id": program_id,
            "module_curos_awarded": module_curos if not was_completed else 0,
        }
    else:
        print("Module was already marked as completed")
        return {
            "success": False,
            "module_id": module_id,
            "user_id": user_id,
            "is_completed": True,
            "already_completed": True,
        }


def check_module_completion(user_id: int, module_id: int, db: Session):
    """Check if all content in a module is complete and mark the module complete if so."""
    print(f"=== CHECKING MODULE COMPLETION ===")
    print(f"User ID: {user_id}, Module ID: {module_id}")

    # Load the module with all its content
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        print(f"ERROR: Module {module_id} not found!")
        return False

    print(f"Module found: {module.title} (ID: {module.id})")
    print(f"Program ID: {module.program_id}")

    # Get all content items in the module
    videos = module.videos or []
    quizzes = module.quizzes or []
    written_lessons = module.written_lessons or []
    surveys = module.survey_forms or []
    assignments = module.assignments or []

    print(
        f"Content counts - Videos: {len(videos)}, Quizzes: {len(quizzes)}, Lessons: {len(written_lessons)}, Surveys: {len(surveys)}, Assignments: {len(assignments)}"
    )

    total_content = (
        len(videos)
        + len(quizzes)
        + len(written_lessons)
        + len(surveys)
        + len(assignments)
    )
    print(f"Total content items in module: {total_content}")

    # If module has no content, mark it as complete
    if total_content == 0:
        print("Module has no content - marking as complete")
        return mark_module_complete(user_id, module_id, module.program_id, db)

    # Check video completion (Optimized bulk check)
    if videos:
        completed_video_ids = {
            v[0]
            for v in db.query(VideoCompletion.video_id)
            .filter(
                VideoCompletion.user_id == user_id,
                VideoCompletion.video_id.in_([v.id for v in videos]),
                VideoCompletion.is_completed == True,
            )
            .all()
        }
        for video in videos:
            if video.id not in completed_video_ids:
                print(f"VIDEO NOT COMPLETED: Video {video.id} - {video.title}")
                return False
            print(f"Video completed: {video.id} - {video.title}")

    # Check quiz completion
    for quiz in quizzes:
        latest_attempt = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == user_id, QuizAttempt.quiz_id == quiz.id
            )
            .order_by(QuizAttempt.attempted_at.desc())
            .first()
        )
        if not latest_attempt:
            print(f"QUIZ NO ATTEMPT: Quiz {quiz.id} - {quiz.title}")
            return False
        if not latest_attempt.passed:
            print(
                f"QUIZ NOT PASSED: Quiz {quiz.id} - {quiz.title} (Score: {latest_attempt.score})"
            )
            return False
        print(f"Quiz passed: {quiz.id} - {quiz.title}")

    # Check written lesson completion (Optimized bulk check)
    if written_lessons:
        completed_lesson_ids = {
            l[0]
            for l in db.query(WrittenLessonCompletion.lesson_id)
            .filter(
                WrittenLessonCompletion.user_id == user_id,
                WrittenLessonCompletion.lesson_id.in_(
                    [l.id for l in written_lessons]
                ),
                WrittenLessonCompletion.is_completed == True,
            )
            .all()
        }
        for lesson in written_lessons:
            if lesson.id not in completed_lesson_ids:
                print(
                    f"LESSON NOT COMPLETED: Lesson {lesson.id} - {lesson.title}"
                )
                return False
            print(f"Lesson completed: {lesson.id} - {lesson.title}")

    # Check survey completion (Optimized bulk check)
    if surveys:
        completed_survey_ids = {
            s[0]
            for s in db.query(SurveyCompletion.survey_id)
            .filter(
                SurveyCompletion.user_id == user_id,
                SurveyCompletion.survey_id.in_([s.id for s in surveys]),
                SurveyCompletion.is_completed == True,
            )
            .all()
        }
        for survey in surveys:
            if survey.id not in completed_survey_ids:
                print(
                    f"SURVEY NOT COMPLETED: Survey {survey.id} - {survey.title}"
                )
                return False
            print(f"Survey completed: {survey.id} - {survey.title}")

    # Check assignment completion (Optimized bulk check)
    if assignments:
        completed_assignment_ids = {
            a[0]
            for a in db.query(AssignmentSubmission.assignment_id)
            .filter(
                AssignmentSubmission.user_id == user_id,
                AssignmentSubmission.assignment_id.in_(
                    [a.assignment_id for a in assignments]
                ),
                AssignmentSubmission.status == "Submitted",
            )
            .all()
        }
        for assignment in assignments:
            if assignment.assignment_id not in completed_assignment_ids:
                print(
                    f"ASSIGNMENT NOT SUBMITTED: Assignment {assignment.assignment_id} - {assignment.title}"
                )
                return False
            print(
                f"Assignment submitted: {assignment.assignment_id} - {assignment.title}"
            )

    # All content is complete - mark module complete
    print("ALL CONTENT COMPLETE - Marking module as complete")
    mark_module_complete(user_id, module_id, module.program_id, db)
    return True


def update_program_progress_after_module_completion(
    user_id: int, program_id: int, db: Session
):
    """Helper function to update program progress after module completion."""
    print(f"\n{'='*40}")
    print(f"=== INSIDE update_program_progress_after_module_completion ===")
    print(f"User ID: {user_id}, Program ID: {program_id}")

    # Get current user curos before any changes
    user_before = db.query(User).filter(User.user_id == user_id).first()
    print(
        f"User curos BEFORE program progress update: {user_before.curos if user_before else 'None'}"
    )

    # Get all modules in the program (Optimized selection)
    modules = (
        db.query(Module.id)
        .filter(Module.program_id == program_id)
        .order_by(Module.module_order)
        .all()
    )
    total_modules = len(modules)
    print(f"Total modules in program: {total_modules}")

    # Get completed modules for this user (Optimized selection)
    completed_modules = (
        db.query(ModuleCompletion.module_id)
        .filter(
            ModuleCompletion.user_id == user_id,
            ModuleCompletion.program_id == program_id,
            ModuleCompletion.is_completed == True,
        )
        .all()
    )
    completed_module_ids = [cm[0] for cm in completed_modules]
    completed_count = len(completed_modules)
    print(f"Completed modules: {completed_module_ids}")
    print(f"Completed count: {completed_count}")

    progress_percentage = (
        int((completed_count / total_modules) * 100)
        if total_modules > 0
        else 0
    )
    print(f"Progress percentage: {progress_percentage}%")

    # Determine next incomplete module
    current_module = None
    for module in modules:
        if module[0] not in completed_module_ids:
            current_module = module[0]
            print(f"Next incomplete module: {current_module}")
            break

    if current_module is None and len(modules) > 0:
        current_module = modules[-1][0]
        print(f"All modules completed, current_module set to last: {current_module}")

    # Update or create program progress
    program_progress = (
        db.query(UserProgramProgress)
        .filter(
            UserProgramProgress.user_id == user_id,
            UserProgramProgress.program_id == program_id,
        )
        .first()
    )

    if program_progress:
        print(f"Found existing program progress: ID={program_progress.id}")
        program_progress.completed_percentage = progress_percentage
        program_progress.current_module = current_module

        if progress_percentage == 100:
            print("Program is 100% complete!")
            program_progress.completed = True
            program_progress.status = "Completed"
            program_progress.completed_at = datetime.utcnow()

            # Award program completion curos
            program = (
                db.query(Program).filter(Program.id == program_id).first()
            )
            program_curos = program.curos if program else 0
            print(f"Program curos to award: {program_curos}")

            if program_curos > 0:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    old_curos = user.curos or 0
                    new_curos = old_curos + program_curos
                    print(f"User curos before program award: {old_curos}")
                    user.curos = new_curos
                    print(f"User curos after program award: {new_curos}")
                    db.add(user)
                else:
                    print("User not found!")
        else:
            program_progress.status = "In Progress"
    else:
        print("Creating new program progress record")
        program_progress = UserProgramProgress(
            user_id=user_id,
            program_id=program_id,
            status="Completed" if progress_percentage == 100 else "In Progress",
            completed_percentage=progress_percentage,
            completed=(progress_percentage == 100),
            current_module=current_module,
        )
        if progress_percentage == 100:
            program_progress.completed_at = datetime.utcnow()

            # Award program completion curos
            program = (
                db.query(Program).filter(Program.id == program_id).first()
            )
            program_curos = program.curos if program else 0
            print(f"Program curos to award: {program_curos}")

            if program_curos > 0:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    old_curos = user.curos or 0
                    new_curos = old_curos + program_curos
                    print(f"User curos before program award: {old_curos}")
                    user.curos = new_curos
                    print(f"User curos after program award: {new_curos}")
                    db.add(user)
                else:
                    print("User not found!")

        db.add(program_progress)

    # ==========================================
    # PROGRAM COMPLETION NOTIFICATIONS
    # ==========================================

    if progress_percentage == 100:
        print("==========================================")
        print("PROGRAM IS 100% COMPLETE")
        print("Creating program completion notifications...")
        print("==========================================")

        create_program_completion_notifications(
            user_id=user_id, program_id=program_id, db=db
        )

    # ==========================================
    # FINAL COMMIT
    # ==========================================

    print("Committing program progress + notifications...")
    db.commit()
    print("Program progress + notifications committed successfully!")

    # Verify final state
    user_after = db.query(User).filter(User.user_id == user_id).first()
    print(
        f"User curos AFTER program progress update: {user_after.curos if user_after else 'None'}"
    )
    print(f"{'='*40}\n")