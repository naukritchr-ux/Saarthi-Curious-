from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Boolean,
    DateTime,
    Text,
    Time,
    ForeignKey,
    JSON,
    BigInteger,
    Numeric,
    SmallInteger,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import declarative_base, relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    reporting_manager = Column(Text)
    city = Column(String)
    date_of_joining = Column(Date)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    curos = Column(BigInteger, default=0)
    Team_Leader_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)


class NotificationScript(Base):
    __tablename__ = "notification_scripts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=True)
    audience = Column(String, nullable=False)
    schedule_type = Column(String, nullable=False, default="once")
    trigger_type = Column(String, nullable=False, default="scheduled")
    schedule_time = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at_time = Column(DateTime, default=datetime.now, nullable=False)
    schedule_date = Column(Date, nullable=True)

    # Relationship with User Notifications
    notifications = relationship(
        "UserNotification",
        back_populates="script",
        cascade="all, delete-orphan"
    )

    recipients = relationship(
    "NotificationScriptRecipient",
    back_populates="script",
    cascade="all, delete-orphan"
)


class NotificationScriptRecipient(Base):
    __tablename__ = "notification_script_recipients"

    id = Column(Integer, primary_key=True, index=True)

    script_id = Column(
        Integer,
        ForeignKey(
            "notification_scripts.id",
            ondelete="CASCADE"
        ),
        nullable=True
    )

    recipient_type = Column(
        String,
        nullable=False
    )

    recipient_value = Column(
        String,
        nullable=False
    )

    script = relationship(
        "NotificationScript",
        back_populates="recipients"
    )

class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )

    script_id = Column(
        Integer,
        ForeignKey("notification_scripts.id", ondelete="CASCADE"),
        nullable=True
    )

    program_id = Column(
        BigInteger,
    ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=True
    )

    retention_quiz_id = Column(
        BigInteger,
        ForeignKey("retention_quizzes.id", ondelete="CASCADE"),
        nullable=True
    )

    application_check_id = Column(
        BigInteger,
        ForeignKey(
            "application_checks.id",
            ondelete="CASCADE"
        ),
        nullable=True
    )


    title = Column(
        String,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    notification_type = Column(
        String,
        nullable=True
    )   

    is_read = Column(
        Boolean,
        default=False
    )

    sent_at = Column(
        DateTime,
        default=datetime.now
    )

    # Relationships
    user = relationship("User")

    script = relationship(
        "NotificationScript",
        back_populates="notifications"
    )

class Program(Base):
    __tablename__ = "programs"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=False)
    duration = Column(String, nullable=True)
    thumbnail = Column(Text, nullable=True)
    status = Column(String, default="Draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    language = Column(String, nullable=True)
    category = Column(String, nullable=True)
    tags = Column(Text, nullable=True)
    unlock_type = Column(String, default="Immediate")
    unlock_days = Column(Integer, default=0)
    curos = Column(BigInteger, default=0)

    modules = relationship("Module", back_populates="program", cascade="all, delete-orphan")
    retention_quiz = relationship(
        "RetentionQuiz",
        back_populates="program",
        uselist=False,
        cascade="all, delete-orphan"
    )
    application_checks = relationship(
        "ApplicationCheck",
        back_populates="program",
        cascade="all, delete-orphan"
    )


class RetentionQuiz(Base):
    __tablename__ = "retention_quizzes"




    __table_args__ = (
        UniqueConstraint(
            "program_id",
            name="uq_retention_quiz_program"
        ),
    )

    id = Column(BigInteger, primary_key=True, index=True)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    curos = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    program_id = Column(
        BigInteger,
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    program = relationship(
        "Program",
        back_populates="retention_quiz"
    )


    id = Column(BigInteger, primary_key=True, index=True)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    curos = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



    questions = relationship(
        "RetentionQuizQuestion",
        back_populates="retention_quiz",
        cascade="all, delete-orphan"
    )


class RetentionQuizQuestion(Base):
    __tablename__ = "retention_quiz_questions"

    id = Column(BigInteger, primary_key=True, index=True)
    retention_quiz_id = Column(BigInteger, ForeignKey("retention_quizzes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    response_format = Column(String, nullable=False, default="Multiple Choice")
    option_a = Column(Text, nullable=True)
    option_b = Column(Text, nullable=True)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)
    correct_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    required = Column(Boolean, nullable=False, default=False)
    display_order = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    retention_quiz = relationship("RetentionQuiz", back_populates="questions")


class ApplicationCheck(Base):
    __tablename__ = "application_checks"


    __table_args__ = (
        UniqueConstraint(
            "program_id",
            "check_number",
            name="uq_application_check_program_number"
        ),
    )

    id = Column(BigInteger, primary_key=True, index=True)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    check_number = Column(Integer, nullable=False, default=1)
    curos = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    program_id = Column(
        BigInteger,
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False
    )

    check_number = Column(
        Integer,
        nullable=False
    )

    unlock_after_days = Column(
        Integer,
        nullable=False,
        default=30
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    program = relationship(
        "Program",
        back_populates="application_checks"
    )


    id = Column(BigInteger, primary_key=True, index=True)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    check_number = Column(Integer, nullable=False, default=1)
    curos = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



    questions = relationship(
        "ApplicationCheckQuestion",
        back_populates="application_check",
        cascade="all, delete-orphan"
    )

    user_progress = relationship(
        "UserApplicationCheckProgress",
        back_populates="application_check",
        cascade="all, delete-orphan"
    )

class ApplicationCheckQuestion(Base):
    __tablename__ = "application_check_questions"

    id = Column(BigInteger, primary_key=True, index=True)
    application_check_id = Column(BigInteger, ForeignKey("application_checks.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    display_order = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application_check = relationship("ApplicationCheck", back_populates="questions")


class RetentionQuizAttempt(Base):
    __tablename__ = "retention_quiz_attempts"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    retention_quiz_id = Column(BigInteger, ForeignKey("retention_quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=True)
    total_questions = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    attempt_number = Column(Integer, default=1)
    answers = Column(JSON, nullable=True)
    total_marks = Column(Integer, default=0)
    percentage = Column(Numeric(5, 2), default=0)

    user = relationship("User")
    retention_quiz = relationship("RetentionQuiz")


class ApplicationCheckAttempt(Base):
    __tablename__ = "application_check_attempts"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    application_check_id = Column(BigInteger, ForeignKey("application_checks.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=True)
    total_questions = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    attempt_number = Column(Integer, default=1)
    answers = Column(JSON, nullable=True)
    total_marks = Column(Integer, default=0)
    percentage = Column(Numeric(5, 2), default=0)

    user = relationship("User")
    application_check = relationship("ApplicationCheck")


class UserApplicationCheckProgress(Base):
    __tablename__ = "user_application_check_progress"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "application_check_id",
            name="uq_user_application_check_progress"
        ),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )

    program_id = Column(
        BigInteger,
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False
    )

    application_check_id = Column(
        BigInteger,
        ForeignKey(
            "application_checks.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="Not Started"
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )

    reviewed_at = Column(
        DateTime,
        nullable=True
    )

    reviewed_by = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    review_comment = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = relationship(
        "User",
        foreign_keys=[user_id]
    )

    program = relationship(
        "Program"
    )

    application_check = relationship(
        "ApplicationCheck",
        back_populates="user_progress"
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by]
    )

class ApplicationCheckAutomationSetting(Base):
    __tablename__ = "application_check_automation_settings"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    is_enabled = Column(
        Boolean,
        nullable=False,
        default=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
class Reward(Base):
    __tablename__ = "rewards"

    id = Column(BigInteger, primary_key=True, index=True)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    video_completion_curos = Column(Integer, default=0)
    program_completion_curos = Column(Integer, default=0)
    retention_quiz_curos = Column(Integer, default=0)
    application_check_curos = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    program = relationship("Program")


class Module(Base):
    __tablename__ = "modules"

    id = Column(BigInteger, primary_key=True, index=True)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    module_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    curos = Column(Integer, default=0)

    program = relationship("Program", back_populates="modules")
    videos = relationship("Video", back_populates="module", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="module", cascade="all, delete-orphan")
    written_lessons = relationship("WrittenLesson", back_populates="module", cascade="all, delete-orphan")
    survey_forms = relationship("SurveyForm", back_populates="module", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="module", cascade="all, delete-orphan")


class ResultTemplate(Base):
    __tablename__ = "result_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    component_name = Column(String(255), nullable=False)
    preview_image = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String(50), default="Classic")
    version = Column(String(20), default="v1.0")
    tags = Column(Text)
    usage_count = Column(Integer, default=0)
    created_by = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_default = Column(Boolean, default=False)

    quizzes = relationship("Quiz", back_populates="result_template")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(String, nullable=False)
    quiz_type = Column(String, nullable=False)
    unlock_after_days = Column(Integer, default=0)
    completion_deadline_days = Column(Integer, default=0)
    curos_reward = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    module_id = Column(BigInteger, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    description = Column(Text, nullable=True)
    unlock_type = Column(String, default="Immediate")
    content_order = Column(Integer, default=1)
    passing_percentage = Column(Integer, nullable=False)
    result_template_id = Column(Integer, ForeignKey("result_templates.id"), nullable=True)

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    module = relationship("Module", back_populates="quizzes")
    result_template = relationship("ResultTemplate", back_populates="quizzes")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True)
    dashboard = Column(Boolean, default=False)
    programs = Column(Boolean, default=True)
    reports = Column(Boolean, default=True)
    analytics = Column(Boolean, default=True)
    settings = Column(Boolean, default=True)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(BigInteger, primary_key=True, index=True)
    quiz_id = Column(BigInteger, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    options = Column(JSON, nullable=False, default=list)
    question_order = Column(Integer, default=1)
    marks = Column(Integer, default=1)

    quiz = relationship("Quiz", back_populates="questions")


class Video(Base):
    __tablename__ = "videos"

    id = Column(BigInteger, primary_key=True, index=True)
    module_id = Column(BigInteger, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    youtube_url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    description = Column(Text, nullable=True)
    subtitle = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    explanation_text = Column(Text, nullable=True)
    content_order = Column(SmallInteger, nullable=True)

    module = relationship("Module", back_populates="videos")
    documents = relationship("VideoDocument", back_populates="video", cascade="all, delete-orphan")


class VideoDocument(Base):
    __tablename__ = "video_documents"

    id = Column(BigInteger, primary_key=True, index=True)
    video_id = Column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="documents")


class WrittenLesson(Base):
    __tablename__ = "written_lessons"

    id = Column(BigInteger, primary_key=True, index=True)
    module_id = Column(BigInteger, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    content_order = Column(Integer, default=1)

    module = relationship("Module", back_populates="written_lessons")


class Assignment(Base):
    __tablename__ = "assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    max_marks = Column(Integer, default=100)
    passing_marks = Column(Integer, default=60)
    submission_type = Column(String, default="file")
    allow_multiple_files = Column(Boolean, default=False)
    allow_late_submission = Column(Boolean, default=False)
    late_penalty = Column(Integer, default=0)
    max_file_size = Column(Integer, default=50)
    status = Column(String, default="Published")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    module = relationship("Module", back_populates="assignments")


class AssignmentResource(Base):
    __tablename__ = "assignment_resources"

    resource_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String)
    file_url = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    submission_id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    text_answer = Column(Text)
    file_url = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Submitted")
    marks = Column(Integer)
    feedback = Column(Text)
    graded_by = Column(Integer, ForeignKey("users.user_id"))
    graded_at = Column(DateTime)

    assignment = relationship("Assignment")
    user = relationship("User", foreign_keys=[user_id])


class SurveyForm(Base):
    __tablename__ = "survey_forms"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_template = Column(Boolean, default=False)
    is_reused = Column(Boolean, default=False, nullable=False)
    content_order = Column(Integer, default=1)

    questions = relationship("SurveyQuestion", back_populates="survey", cascade="all, delete-orphan")
    module = relationship("Module", back_populates="survey_forms")


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("survey_forms.id", ondelete="CASCADE"), nullable=True)
    question = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)
    is_required = Column(Boolean, default=False)
    question_order = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    survey = relationship("SurveyForm", back_populates="questions")
    options = relationship("SurveyOption", back_populates="question", cascade="all, delete-orphan")


class SurveyOption(Base):
    __tablename__ = "survey_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("survey_questions.id", ondelete="CASCADE"), nullable=True)
    option_text = Column(Text, nullable=False)
    option_order = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("SurveyQuestion", back_populates="options")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("survey_forms.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    survey = relationship("SurveyForm")
    user = relationship("User")
    answers = relationship("SurveyAnswer", back_populates="response", cascade="all, delete-orphan")


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("survey_responses.id", ondelete="CASCADE"), nullable=True)
    question_id = Column(Integer, ForeignKey("survey_questions.id", ondelete="CASCADE"), nullable=True)
    answer = Column(Text, nullable=True)

    response = relationship("SurveyResponse", back_populates="answers")
    question = relationship("SurveyQuestion")


class SurveyTemplate(Base):
    __tablename__ = "survey_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = relationship("SurveyTemplateQuestion", back_populates="template", cascade="all, delete-orphan")


class SurveyTemplateQuestion(Base):
    __tablename__ = "survey_template_questions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("survey_templates.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)
    is_required = Column(Boolean, default=False)
    question_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("SurveyTemplate", back_populates="questions")
    options = relationship("SurveyTemplateOption", back_populates="question", cascade="all, delete-orphan")


class SurveyTemplateOption(Base):
    __tablename__ = "survey_template_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("survey_template_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(Text, nullable=False)
    option_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("SurveyTemplateQuestion", back_populates="options")


class UserProgramProgress(Base):
    __tablename__ = "user_program_progress"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    program_id = Column(BigInteger, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    completed_percentage = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    retention_quiz_unlocked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Not Started")
    retention_quiz = Column(Boolean, default=False)
    streak_completed = Column(Boolean, default=False)
    application_completed = Column(Boolean, default=False)
    current_module = Column(BigInteger, nullable=True)

    user = relationship("User")
    program = relationship("Program")


class UserVideoProgress(Base):
    __tablename__ = "user_video_progress"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    video_id = Column(BigInteger, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    video = relationship("Video")


class VideoCompletion(Base):
    __tablename__ = "video_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, nullable=True)
    watch_time_seconds = Column(Integer, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_position = Column(Integer, nullable=True)

    user = relationship("User")
    video = relationship("Video")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(BigInteger, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=True)
    total_questions = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    attempt_number = Column(Integer, default=1)
    answers = Column(JSON, nullable=True)
    total_marks = Column(Integer, default=0)
    percentage = Column(Numeric(5, 2), default=0)

    user = relationship("User")
    quiz = relationship("Quiz")


class QuizAttemptAnswer(Base):
    __tablename__ = "quiz_attempt_answers"

    id = Column(BigInteger, primary_key=True, index=True)
    attempt_id = Column(BigInteger, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(BigInteger, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    selected_option = Column(Integer, nullable=False)
    is_correct = Column(Boolean, default=False)
    marks_earned = Column(Integer, default=0)


class WrittenLessonCompletion(Base):
    __tablename__ = "written_lesson_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("written_lessons.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False)
    scroll_position = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    lesson = relationship("WrittenLesson")


class SurveyCompletion(Base):
    __tablename__ = "survey_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    survey_id = Column(Integer, ForeignKey("survey_forms.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    survey = relationship("SurveyForm")


class ModuleCompletion(Base):
    __tablename__ = "module_completions"
    __table_args__ = (
        UniqueConstraint('user_id', 'module_id', name='unique_user_module'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, nullable=True, default=False)
    completed_modules = Column(JSON, nullable=True, default=list)
    progress_percentage = Column(Integer, nullable=True, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    module = relationship("Module")
    program = relationship("Program")


class LearningStreak(Base):
    __tablename__ = "learning_streaks"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(Date)
    total_learning_days = Column(Integer, default=0)
    freezes = Column(Integer, default=0)  # Add this new column
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Badge(Base):
    __tablename__ = "badges"

    badge_id = Column(BigInteger, primary_key=True, index=True)
    badge_name = Column(Text, nullable=False)
    badge_type = Column(Text, nullable=False)
    tier = Column(Text, nullable=False)
    requirement_value = Column(Integer, nullable=False)
    curos_reward = Column(Integer, default=0)
    description = Column(Text, nullable=True)  # NOTE: DB column type is `integer`, not text — confirm with team
    badge_icon = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserBadge(Base):
    __tablename__ = "user_badges"

    user_badge_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    badge_id = Column(BigInteger, ForeignKey("badges.badge_id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)


class PendingAction(Base):
    __tablename__ = "pending_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    entity_id = Column(Integer, nullable=False)
    entity_type = Column(String(50), nullable=False)
    requested_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(Text, nullable=True)
    action = Column(Text, nullable=False)
    entity_type = Column(Text, nullable=True)
    entity_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    log_metadata = Column("metadata", JSON)
    ip_address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)
    generated_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    generated_for = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    storage_path = Column(String, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    status = Column(String, default="completed")
    ai_summary = Column(JSON, nullable=True)

    generator = relationship("User", foreign_keys=[generated_by])
    target_user = relationship("User", foreign_keys=[generated_for])
    role = relationship("Role")

    __table_args__ = (
        UniqueConstraint('report_type', 'generated_for', 'period_start', 'period_end', 'status', name='idx_report_reuse_lookup'),
    )

class AdminSchedule(Base):
    __tablename__ = "admin_schedule"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(BigInteger, nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    schedule_id = Column(
        BigInteger,
        nullable=False,
        unique=True
    )

    user_id = Column(
        BigInteger,
        nullable=False
    )

    admin_id = Column(
        BigInteger,
        nullable=False
    )

    meeting_link = Column(
        String,
        nullable=True
    )

    google_event_id = Column(
        String,
        nullable=True
    )

    booking_status = Column(
        String(20),
        nullable=False,
        default="confirmed"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )