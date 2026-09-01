from pydantic import BaseModel, root_validator, validator
from datetime import date, time, datetime
from typing import Optional, List, Literal

# =========================
# AUTHENTICATION
# =========================

class LoginRequest(BaseModel):
    email: str
    password: str


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


# =========================
# USER MANAGEMENT
# =========================

class UserCreate(BaseModel):
    full_name: str
    email: str
    city: Optional[str] = None
    reporting_manager: Optional[str] = None
    Team_Leader_id: Optional[int] = None
    role_id: int
    password: str
    date_of_joining: Optional[date] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    reporting_manager: Optional[str] = None
    Team_Leader_id: Optional[int] = None
    role_id: Optional[int] = None
    date_of_joining: Optional[date] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserProfileResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    city: Optional[str] = None
    reporting_manager: Optional[str] = None
    Team_Leader_id: Optional[int] = None
    team_leader_name: Optional[str] = None  # computed, not a DB column
    role_id: int
    date_of_joining: Optional[date] = None
    created_at: datetime
    is_active: bool
    last_login: Optional[datetime] = None
    curos: int = 0

    class Config:
        from_attributes = True


# =========================
# ROLE MANAGEMENT
# =========================

class RoleResponse(BaseModel):
    id: int
    role_name: Optional[str] = None
    dashboard: bool
    programs: bool
    reports: bool
    analytics: bool
    settings: bool

    class Config:
        from_attributes = True


# =========================
# NOTIFICATION SCRIPTS
# =========================

class NotificationRecipient(BaseModel):
    type: Literal["all", "role", "user"]
    value: str | int
class NotificationScriptCreate(BaseModel):
    title: str
    message: str
    notification_type: str
    audience: str
    recipients: List[NotificationRecipient] = []
    schedule_type: str = "once"
    schedule_time: Optional[time] = None
    schedule_date: Optional[date] = None
    trigger_type: str = "scheduled"

    @validator("schedule_type", pre=True, always=True)
    def normalize_schedule_type(cls, value):
        if value is None:
            return "once"
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized not in {"once", "daily"}:
                raise ValueError("schedule_type must be either 'once' or 'daily'")
            return normalized
        raise ValueError("schedule_type must be a string")

    @root_validator(skip_on_failure=True)
    def validate_schedule_fields(cls, values):
        schedule_type = values.get("schedule_type")
        schedule_time = values.get("schedule_time")

        if schedule_type == "daily" and schedule_time is None:
            raise ValueError("schedule_time is required when schedule_type is 'daily'")

        return values


class NotificationScriptResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    audience: str
    schedule_type: str
    schedule_time: Optional[time] = None
    schedule_date: Optional[date] = None
    is_active: bool
    created_at_time: datetime

    class Config:
        from_attributes = True


# =========================
# PROGRAMS
# =========================

class ProgramCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    duration: Optional[str] = None
    thumbnail: Optional[str] = None
    language: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    status: str = "Draft"
    unlock_type: str = "Immediate"
    unlock_days: int = 0
    curos: Optional[int] = 0


class ProgramResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    type: str
    duration: Optional[str] = None
    thumbnail: Optional[str] = None
    language: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    status: str
    unlock_type: str
    unlock_days: int
    created_at: datetime
    updated_at: datetime
    curos: int = 0

    class Config:
        from_attributes = True


class RetentionQuizQuestionCreate(BaseModel):
    question: str
    response_format: str = "Multiple Choice"
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    required: bool = False
    explanation: Optional[str] = None
    display_order: int = 1


class RetentionQuizQuestionUpdate(BaseModel):
    question: Optional[str] = None
    response_format: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    required: Optional[bool] = False
    explanation: Optional[str] = None
    display_order: Optional[int] = None


class RetentionQuizQuestionResponse(BaseModel):
    id: int
    question: str
    response_format: str = "Multiple Choice"
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    required: bool
    explanation: Optional[str] = None
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RetentionQuizCreate(BaseModel):
    questions: List[RetentionQuizQuestionCreate]


class RetentionQuizUpdate(BaseModel):
    curos: Optional[int] = 0
    questions: Optional[List[RetentionQuizQuestionUpdate]] = None


class RetentionQuizResponse(BaseModel):
    id: int
    curos: int
    questions: List[RetentionQuizQuestionResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationCheckQuestionCreate(BaseModel):
    question: str
    display_order: int = 1


class ApplicationCheckQuestionUpdate(BaseModel):
    question: Optional[str] = None
    display_order: Optional[int] = None


class ApplicationCheckQuestionResponse(BaseModel):
    id: int
    question: str
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationCheckCreate(BaseModel):
    check_number: int = 1
    questions: List[ApplicationCheckQuestionCreate]


class ApplicationCheckUpdate(BaseModel):
    curos: Optional[int] = 0
    check_number: Optional[int] = None
    questions: Optional[List[ApplicationCheckQuestionUpdate]] = None


class ApplicationCheckResponse(BaseModel):
    id: int
    check_number: int


    unlock_after_days: int

    curos: int


    unlock_after_days: int
    curos: int

    questions: List[ApplicationCheckQuestionResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RetentionQuizAttemptCreate(BaseModel):
    user_id: int
    retention_quiz_id: int
    answers: List[dict]
    attempt_number: int = 1


class RetentionQuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    retention_quiz_id: int
    score: Optional[int] = None
    total_questions: Optional[int] = None
    total_marks: int
    percentage: float
    passed: Optional[bool] = None
    attempt_number: int
    answers: Optional[List[dict]] = None
    attempted_at: datetime

    class Config:
        from_attributes = True


class ApplicationCheckAttemptCreate(BaseModel):
    user_id: int
    application_check_id: int
    answers: List[dict]
    attempt_number: int = 1


class ApplicationCheckAttemptResponse(BaseModel):
    id: int
    user_id: int
    application_check_id: int
    score: Optional[int] = None
    total_questions: Optional[int] = None
    total_marks: int
    percentage: float
    passed: Optional[bool] = None
    attempt_number: int
    answers: Optional[List[dict]] = None
    attempted_at: datetime

    class Config:
        from_attributes = True

class UserApplicationCheckProgressCreate(BaseModel):
    user_id: int
    program_id: int
    application_check_id: int
    status: str = "Not Started"


class UserApplicationCheckProgressUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    review_comment: Optional[str] = None


class UserApplicationCheckProgressResponse(BaseModel):
    id: int
    user_id: int
    program_id: int
    application_check_id: int
    status: str
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    review_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
class AvailableQuizResponse(BaseModel):
    type: str  # "retention_quiz" or "application_check"
    id: int
    program_id: int
    program_name: str
    title: str
    check_number: Optional[int] = None
    days_since_completion: int
    is_available: bool


# =========================
# REWARDS
# =========================

class RewardCreate(BaseModel):
    program_id: int
    video_completion_curos: int = 0
    program_completion_curos: int = 0
    retention_quiz_curos: int = 0
    application_check_curos: int = 0


class RewardResponse(RewardCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# MODULES
# =========================

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    module_order: int
    curos: Optional[int] = 0


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    module_order: Optional[int] = None
    is_active: Optional[bool] = None
    curos: Optional[int] = None


class ModuleResponse(BaseModel):
    id: int
    program_id: int
    title: str
    description: Optional[str] = None
    module_order: int
    is_active: bool
    curos: int
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# VIDEO LESSONS
# =========================

class VideoCreateSchema(BaseModel):
    module_id: int
    title: str
    subtitle: Optional[str] = None
    youtube_url: str
    description: Optional[str] = None
    explanation_text: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content_order: Optional[int] = None


class VideoResponse(BaseModel):
    id: int
    module_id: int
    title: str
    subtitle: Optional[str] = None
    youtube_url: str
    description: Optional[str] = None
    explanation_text: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content_order: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# VIDEO DOCUMENTS
# =========================

class VideoDocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    file_url: str


class VideoDocumentResponse(BaseModel):
    id: int
    video_id: int
    title: str
    description: Optional[str] = None
    file_url: str
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# WRITTEN LESSONS
# =========================

class WrittenLessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    pdf_url: Optional[str] = None
    content_order: int = 1


class WrittenLessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    pdf_url: Optional[str] = None
    is_active: Optional[bool] = None
    content_order: Optional[int] = None


class WrittenLessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    content: Optional[str] = None
    pdf_url: Optional[str] = None
    is_active: bool
    content_order: int
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# ASSIGNMENTS
# =========================

class AssignmentCreate(BaseModel):
    module_id: int
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    deadline: Optional[datetime] = None
    max_marks: int = 100
    passing_marks: int = 60
    submission_type: str = "file"
    allow_multiple_files: bool = False
    allow_late_submission: bool = False
    late_penalty: int = 0
    max_file_size: int = 50


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    deadline: Optional[datetime] = None
    max_marks: Optional[int] = None
    passing_marks: Optional[int] = None
    submission_type: Optional[str] = None
    allow_multiple_files: Optional[bool] = None
    allow_late_submission: Optional[bool] = None
    late_penalty: Optional[int] = None
    max_file_size: Optional[int] = None
    status: Optional[str] = None


class AssignmentResponse(AssignmentCreate):
    assignment_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssignmentResourceCreate(BaseModel):
    assignment_id: int
    file_name: Optional[str] = None
    file_url: Optional[str] = None


class AssignmentResourceResponse(AssignmentResourceCreate):
    resource_id: int
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssignmentSubmissionCreate(BaseModel):
    assignment_id: int
    user_id: int
    text_answer: Optional[str] = None
    file_url: Optional[str] = None


class AssignmentSubmissionGrade(BaseModel):
    marks: Optional[int] = None
    feedback: Optional[str] = None
    status: Optional[str] = None
    graded_by: Optional[int] = None


class AssignmentSubmissionResponse(BaseModel):
    submission_id: int
    assignment_id: int
    user_id: int
    text_answer: Optional[str] = None
    file_url: Optional[str] = None
    submitted_at: Optional[datetime] = None
    status: Optional[str] = None
    marks: Optional[int] = None
    feedback: Optional[str] = None
    graded_by: Optional[int] = None
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =========================
# RESULT TEMPLATES
# =========================

class ResultTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    component_name: str
    preview_image: Optional[str] = None
    category: str = "Classic"
    version: str = "v1.0"
    tags: Optional[str] = None
    usage_count: int = 0
    created_by: Optional[int] = None
    is_default: bool = False
    is_active: bool = True


class ResultTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    component_name: Optional[str] = None
    preview_image: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    tags: Optional[str] = None
    usage_count: Optional[int] = None
    created_by: Optional[int] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class ResultTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    component_name: str
    preview_image: Optional[str] = None
    category: str
    version: str
    tags: Optional[str] = None
    usage_count: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_default: bool
    is_active: bool

    class Config:
        from_attributes = True


# =========================
# QUIZZES & DYNAMIC QUESTIONS
# =========================

class OptionSchema(BaseModel):
    text: str
    isCorrect: bool


class QuestionCreateSchema(BaseModel):
    question: str
    options: List[OptionSchema]
    explanation: Optional[str] = None
    marks: int = 1


class BulkQuestionsInput(BaseModel):
    questions: List[QuestionCreateSchema]


class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question: str
    options: List[OptionSchema]
    explanation: Optional[str] = None
    marks: int
    question_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuizCreateSchema(BaseModel):
    module_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    quiz_type: str = "MCQ"
    unlock_type: str = "Immediate"
    unlock_after_days: int = 0
    completion_deadline_days: int = 0
    curos_reward: int = 0
    content_order: int = 1
    passing_percentage: int
    result_template_id: Optional[int] = None


class QuizResponse(BaseModel):
    id: int
    module_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    quiz_type: str
    unlock_type: str
    unlock_after_days: int
    completion_deadline_days: int
    curos_reward: int
    content_order: int
    passing_percentage: int
    created_at: datetime
    result_template_id: Optional[int] = None

    class Config:
        from_attributes = True


# =========================
# SURVEYS & TEMPLATES
# =========================

class SurveyOptionCreate(BaseModel):
    option_text: str
    option_order: int = 1


class SurveyOptionResponse(BaseModel):
    id: int
    question_id: int
    option_text: str
    option_order: int

    class Config:
        from_attributes = True


class SurveyQuestionCreate(BaseModel):
    question: str
    question_type: str
    is_required: bool = False
    question_order: int = 1
    options: List[SurveyOptionCreate] = []


class SurveyQuestionResponse(BaseModel):
    id: int
    survey_id: int
    question: str
    question_type: str
    is_required: bool
    question_order: int
    options: List[SurveyOptionResponse] = []

    class Config:
        from_attributes = True


class SurveyFormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_template: bool = False
    content_order: int = 1


class SurveyFormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_template: Optional[bool] = None
    is_active: Optional[bool] = None
    content_order: Optional[int] = None


class SurveyFormResponse(BaseModel):
    id: int
    module_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    is_template: bool
    is_active: bool
    is_reused: bool
    content_order: int
    created_at: datetime
    updated_at: datetime
    questions: List[SurveyQuestionResponse] = []

    class Config:
        from_attributes = True


class SurveyGalleryOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    questions: List[SurveyQuestionResponse] = []

    class Config:
        from_attributes = True


class SurveyDuplicateRequest(BaseModel):
    module_id: int
    title: str


class SurveyReuseRequest(BaseModel):
    module_id: int
    template_id: int


class SurveyAnswerSubmit(BaseModel):
    question_id: int
    answer: Optional[str] = None


class SurveyResponseCreate(BaseModel):
    survey_id: int
    user_id: int
    answers: List[SurveyAnswerSubmit] = []


class SurveyAnswerOut(BaseModel):
    id: int
    response_id: int
    question_id: int
    answer: Optional[str] = None

    class Config:
        from_attributes = True


class SurveyResponseOut(BaseModel):
    id: int
    survey_id: int
    user_id: int
    submitted_at: datetime
    answers: List[SurveyAnswerOut] = []

    class Config:
        from_attributes = True


# =========================
# REUSABLE SURVEY TEMPLATES
# =========================

class SurveyTemplateOptionCreate(BaseModel):
    option_text: str
    option_order: int = 0


class SurveyTemplateOptionResponse(BaseModel):
    id: int
    option_text: str
    option_order: int

    class Config:
        from_attributes = True


class SurveyTemplateQuestionCreate(BaseModel):
    question: str
    question_type: str
    is_required: bool = False
    question_order: int = 0
    options: List[SurveyTemplateOptionCreate] = []


class SurveyTemplateQuestionResponse(BaseModel):
    id: int
    question: str
    question_type: str
    is_required: bool
    question_order: int
    options: List[SurveyTemplateOptionResponse]

    class Config:
        from_attributes = True


class SurveyTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    created_by: Optional[int] = None
    questions: List[SurveyTemplateQuestionCreate] = []


class SurveyTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SurveyTemplateResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_by: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    questions: List[SurveyTemplateQuestionResponse] = []

    class Config:
        from_attributes = True


# =========================
# CURO MANAGEMENT
# =========================

class UpdateProgramCurosRequest(BaseModel):
    curos: int


class LeaderboardEntry(BaseModel):
    user_id: int
    name: str
    curos: int
    role_id: int


# =========================
# LEARNER PROGRESS TRACKING
# =========================

class UserProgramProgressCreate(BaseModel):
    user_id: int
    program_id: int


class UserProgramProgressUpdate(BaseModel):
    status: Optional[str] = None
    completed_percentage: Optional[int] = None
    completed: Optional[bool] = None
    completed_at: Optional[datetime] = None
    retention_quiz_unlocked_at: Optional[datetime] = None
    retention_quiz: Optional[bool] = None
    streak_completed: Optional[bool] = None
    application_completed: Optional[bool] = None


class UserProgramProgressResponse(BaseModel):
    id: int
    user_id: int
    program_id: int
    status: str
    completed_percentage: int
    completed: bool
    completed_at: Optional[datetime] = None
    retention_quiz_unlocked_at: Optional[datetime] = None
    retention_quiz: bool
    streak_completed: bool
    application_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserVideoProgressCreate(BaseModel):
    user_id: int
    video_id: int


class UserVideoProgressResponse(BaseModel):
    id: int
    user_id: int
    video_id: int
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VideoCompletionCreate(BaseModel):
    user_id: int
    video_id: int
    watch_time_seconds: int = 0
    last_position: int = 0
    is_completed: bool = False


class VideoCompletionUpdate(BaseModel):
    is_completed: Optional[bool] = None
    watch_time_seconds: Optional[int] = None
    last_position: Optional[int] = None
    completed_at: Optional[datetime] = None


class VideoCompletionResponse(BaseModel):
    id: int
    user_id: int
    video_id: int
    is_completed: Optional[bool] = None
    watch_time_seconds: Optional[int] = None
    completed_at: Optional[datetime] = None
    last_position: Optional[int] = None

    class Config:
        from_attributes = True


class QuizAttemptCreate(BaseModel):
    user_id: int
    quiz_id: int
    answers: List[dict]
    attempt_number: int = 1


class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: Optional[int] = None
    total_questions: Optional[int] = None
    total_marks: int
    percentage: float
    passed: Optional[bool] = None
    attempt_number: int
    answers: Optional[List[dict]] = None
    attempted_at: datetime

    class Config:
        from_attributes = True


class QuizAttemptAnswerCreate(BaseModel):
    attempt_id: int
    question_id: int
    selected_option: int
    is_correct: bool = False
    marks_earned: int = 0


class QuizAttemptAnswerResponse(QuizAttemptAnswerCreate):
    id: int

    class Config:
        from_attributes = True


# =========================
# GAMIFICATION & LEADERBOARD
# =========================

class BadgeCreate(BaseModel):
    badge_name: str
    badge_type: str
    tier: str
    requirement_value: int
    curos_reward: int = 0
    badge_icon: Optional[str] = None
    is_active: bool = True


class BadgeResponse(BaseModel):
    badge_id: int
    badge_name: str
    badge_type: str
    tier: str
    requirement_value: int
    curos_reward: int
    badge_icon: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    user_badge_id: int
    user_id: int
    badge_id: int
    earned_at: datetime
    badge: Optional[BadgeResponse] = None

    class Config:
        from_attributes = True


class LearningStreakResponse(BaseModel):
    user_id: int
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[date] = None
    total_learning_days: int
    freezes: int = 0  # Add this field
    updated_at: datetime

    class Config:
        from_attributes = True

class LearnerStatsResponse(BaseModel):
    total_programs: int
    completed_programs: int
    in_progress_programs: int
    videos_watched: int
    quizzes_passed: int
    badges_earned: int
    current_streak: int
    total_curos: int


# =========================
# USER NOTIFICATIONS
# =========================

class UserNotificationResponse(BaseModel):
    id: int
    user_id: int
    script_id: Optional[int] = None


    program_id: int | None = None
    retention_quiz_id: int | None = None


    program_id: int | None = None
    retention_quiz_id: int | None = None

    title: str
    message: str
    is_read: bool
    sent_at: datetime
    role_id: int


# =========================
# WRITTEN LESSON COMPLETION
# =========================

class WrittenLessonCompletionCreate(BaseModel):
    user_id: int
    lesson_id: int
    scroll_position: int = 0
    is_completed: bool = False


class WrittenLessonCompletionUpdate(BaseModel):
    is_completed: Optional[bool] = None
    scroll_position: Optional[int] = None
    completed_at: Optional[datetime] = None


class WrittenLessonCompletionResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    is_completed: bool
    scroll_position: int
    completed_at: Optional[datetime] = None
    created_at: datetime


    class Config:
        from_attributes = True



class NotificationCountResponse(BaseModel):
    unread: int
# =========================
# SURVEY COMPLETION
# =========================

class SurveyCompletionCreate(BaseModel):
    user_id: int
    survey_id: int
    is_completed: bool = False


class SurveyCompletionUpdate(BaseModel):
    is_completed: Optional[bool] = None
    completed_at: Optional[datetime] = None


class SurveyCompletionResponse(BaseModel):
    id: int
    user_id: int
    survey_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# MODULE COMPLETION
# =========================

class ModuleCompletionCreate(BaseModel):
    user_id: int
    module_id: int
    program_id: int


class ModuleCompletionUpdate(BaseModel):
    is_completed: Optional[bool] = None
    completed_modules: Optional[List[int]] = None
    progress_percentage: Optional[int] = None
    completed_at: Optional[datetime] = None


class ModuleCompletionResponse(BaseModel):
    id: int
    user_id: int
    module_id: int
    program_id: int
    is_completed: bool
    completed_modules: List[int]
    progress_percentage: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================
# ADMIN / SYSTEM
# =========================

class PendingActionCreate(BaseModel):
    action_type: str
    entity_id: int
    entity_type: str
    requested_by: int
    notes: Optional[str] = None


class PendingActionReview(BaseModel):
    status: str  # 'approved' / 'rejected'
    reviewed_by: int
    notes: Optional[str] = None


class PendingActionResponse(BaseModel):
    id: int
    action_type: str
    status: str
    entity_id: int
    entity_type: str
    requested_by: int
    created_at: datetime
    updated_at: datetime
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    message: Optional[str] = None
    log_metadata: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str