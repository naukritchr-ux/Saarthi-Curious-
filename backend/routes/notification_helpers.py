from email_service import send_notification_email
from models import (
    User,
    Program,
    NotificationScript,
    UserNotification,
    RetentionQuiz,
)


def create_program_completion_notifications(
    user_id: int,
    program_id: int,
    db
):
    """
    Create program completion notifications for:
    - Completed Learner
    - Admin
    - Master Admin

    Duplicate notifications are prevented.

    IMPORTANT:
    This function does NOT commit.
    The calling function must call db.commit()
    after this function returns.
    """

    # ==========================================
    # GET COMPLETED USER + PROGRAM
    # ==========================================

    completed_user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    program = (
        db.query(Program)
        .filter(Program.id == program_id)
        .first()
    )

    if not completed_user:
        print(
            f"Could not find completed user: {user_id}"
        )
        return

    if not program:
        print(
            f"Could not find program: {program_id}"
        )
        return

    print("==========================================")
    print("PROGRAM COMPLETION NOTIFICATION")
    print(f"User ID: {completed_user.user_id}")
    print(f"User Name: {completed_user.full_name}")
    print(f"Program ID: {program.id}")
    print(f"Program Name: {program.name}")
    print("==========================================")


    # ==========================================
    # FIND PROGRAM COMPLETION SCRIPT
    # ==========================================

    notification_script = (
        db.query(NotificationScript)
        .filter(
            NotificationScript.trigger_type == "program_completed",
            NotificationScript.is_active == True,
        )
        .first()
    )

    if not notification_script:
        print(
            "ERROR: No active program_completed "
            "notification script found."
        )
        return

    print(
        f"Found program completion script: "
        f"{notification_script.id}"
    )


    # ==========================================
    # NOTIFY ADMIN + MASTER ADMIN
    # ==========================================

    admin_users = (
        db.query(User)
        .filter(
            User.is_active == True,
            User.role_id.in_([1, 2]),
        )
        .all()
    )

    print(
        f"Admin/Master Admin users found: "
        f"{len(admin_users)}"
    )

    admin_count = 0

    for admin in admin_users:

        # ------------------------------------------
        # CHECK DUPLICATE
        # ------------------------------------------

        existing_notification = (
            db.query(UserNotification)
            .filter(
                UserNotification.user_id == admin.user_id,
                UserNotification.program_id == program.id,
                UserNotification.script_id == notification_script.id,
            )
            .first()
        )

        if existing_notification:
            print(
                f"Admin notification already exists "
                f"for user {admin.user_id}"
            )
            continue

        # ------------------------------------------
        # CREATE MESSAGE
        # ------------------------------------------

        message = notification_script.message

        message = message.replace(
            "{userName}",
            completed_user.full_name or ""
        )

        message = message.replace(
            "{programName}",
            program.name or ""
        )

        # ------------------------------------------
        # CREATE ADMIN NOTIFICATION
        # ------------------------------------------

        notification = UserNotification(
            user_id=admin.user_id,
            script_id=notification_script.id,
            program_id=program.id,
            title=notification_script.title,
            message=message,
        )

        db.add(notification)

        if admin.email:
            try:
                send_notification_email(
                    to_email=admin.email,
                    title=notification.title,
                    message=notification.message,
                )

                print(
                    f"Program completion email sent to admin "
                    f"{admin.user_id}"
                )

            except Exception as e:
                print(
                    f"Failed to send program completion email "
                    f"to admin {admin.user_id}: {e}"
                )
        admin_count += 1

        print(
            f"Admin/Master Admin notification created "
            f"for user {admin.user_id}"
        )

    print(
        "Admin + Master Admin notifications created:",
        admin_count,
    )


    # ==========================================
    # NOTIFY COMPLETED LEARNER
    # ==========================================

    existing_learner_notification = (
        db.query(UserNotification)
        .filter(
            UserNotification.user_id == completed_user.user_id,
            UserNotification.program_id == program.id,
            UserNotification.script_id == notification_script.id,
            UserNotification.title == "Program Completed 🎉",
        )
        .first()
    )

    if existing_learner_notification:

        print(
            "Learner completion notification already exists:",
            completed_user.user_id,
        )

    else:

        learner_notification = UserNotification(
            user_id=completed_user.user_id,

            # IMPORTANT:
            # script_id is required by the database
            script_id=notification_script.id,

            program_id=program.id,

            title="Program Completed 🎉",

            message=(
                f'Congratulations! You have completed the program '
                f'"{program.name}". '
                f'Keep learning and growing! 🚀'
            ),
        )

        db.add(learner_notification)

        if completed_user.email:
            try:
                send_notification_email(
                    to_email=completed_user.email,
                    title=learner_notification.title,
                    message=learner_notification.message,
                )

                print(
                    f"Program completion email sent to learner "
                    f"{completed_user.user_id}"
                )

            except Exception as e:
                print(
                    f"Failed to send program completion email "
                    f"to learner {completed_user.user_id}: {e}"
                )

        print(
            "Learner completion notification CREATED:",
            completed_user.user_id,
        )


    # ==========================================
    # DO NOT COMMIT HERE
    # ==========================================

    print(
        "Program completion notifications prepared."
    )
    print(
        "Waiting for caller to commit."
    )

def create_admin_notification(
    db,
    message: str,
    title: str,
    program_id: int | None = None,
    trigger_type: str | None = None,
):
    """
    Create an in-website notification for active
    Admin and Master Admin users.

    This function does NOT commit.
    The calling function is responsible for committing.
    """

    # ==========================================
    # FIND NOTIFICATION SCRIPT
    # ==========================================

    notification_script = None

    if trigger_type:
        notification_script = (
            db.query(NotificationScript)
            .filter(
                NotificationScript.trigger_type == trigger_type,
                NotificationScript.is_active == True,
            )
            .first()
        )

    # ==========================================
    # FALLBACK: FIND SCRIPT BY TITLE
    # ==========================================

    if not notification_script:
        notification_script = (
            db.query(NotificationScript)
            .filter(
                NotificationScript.title == title,
                NotificationScript.is_active == True,
            )
            .first()
        )

    if not notification_script:
        print(
            f"WARNING: No active notification script found "
            f"for title: {title}"
        )
        return

    print(
        f"Using notification script: "
        f"{notification_script.id}"
    )

    # ==========================================
    # FIND ADMIN + MASTER ADMIN
    # ==========================================

    admin_users = (
        db.query(User)
        .filter(
            User.is_active == True,
            User.role_id.in_([1, 2]),
        )
        .all()
    )

    print(
        f"Admin/Master Admin users found: "
        f"{len(admin_users)}"
    )

    # ==========================================
    # CREATE NOTIFICATIONS
    # ==========================================

    created_count = 0

    for admin in admin_users:

        existing_notification = (
            db.query(UserNotification)
            .filter(
                UserNotification.user_id == admin.user_id,
                UserNotification.program_id == program_id,
                UserNotification.script_id == notification_script.id,
                UserNotification.title == title,
                UserNotification.message == message,
            )
            .first()
        )

        if existing_notification:
            print(
                f"Notification already exists "
                f"for admin {admin.user_id}"
            )
            continue

        notification = UserNotification(
            user_id=admin.user_id,
            script_id=notification_script.id,
            program_id=program_id,
            title=title,
            message=message,
        )

        db.add(notification)

        if admin.email:
            try:
                send_notification_email(
                    to_email=admin.email,
                    title=notification.title,
                    message=notification.message,
                )

                print(
                    f"Application notification email sent to "
                    f"admin {admin.user_id}"
                )

            except Exception as e:
                print(
                    f"Failed to send application notification email "
                    f"to admin {admin.user_id}: {e}"
                )

        created_count += 1

        print(
            f"Notification created for admin "
            f"{admin.user_id}"
        )

    print(
        f"Admin notifications created: "
        f"{created_count}"
    )

   
def create_retention_quiz_completion_notification(
    db,
    user_id: int,
    quiz_id: int,
):
    """
    Create an in-website notification for the learner
    after passing a Retention Quiz.
    """

    # Get the retention quiz
    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(RetentionQuiz.id == quiz_id)
        .first()
    )

    if not retention_quiz:
        print(f"[RETENTION NOTIFICATION] Quiz {quiz_id} not found")
        return

    program_id = retention_quiz.program_id

    notification = UserNotification(
        user_id=user_id,
        script_id=None,
        program_id=program_id,
        retention_quiz_id=quiz_id,
        title="Retention Quiz Passed",
        message=(
            f"Congratulations! You passed the Retention Quiz "
            f"for '{program_name}'. Your result is now available."
        ),
    )

    db.add(notification)

    print(
        f"[RETENTION NOTIFICATION] PASSED notification created "
        f"user={user_id}, quiz={quiz_id}, program={program_id}"
    )

def create_retention_quiz_failed_notification(
    db,
    user_id: int,
    quiz_id: int,
    program_name: str,
):
    """
    Create an in-website notification every time
    the learner fails a Retention Quiz.
    """

    retention_quiz = (
        db.query(RetentionQuiz)
        .filter(RetentionQuiz.id == quiz_id)
        .first()
    )

    if not retention_quiz:
        print(
            f"[RETENTION FAILED NOTIFICATION] "
            f"Quiz {quiz_id} not found"
        )
        return

    program_id = retention_quiz.program_id

    notification = UserNotification(
        user_id=user_id,
        script_id=None,
        program_id=program_id,
        retention_quiz_id=quiz_id,
        title="Retention Quiz Reattempt Required",
        message=(
            f"You did not pass the Retention Quiz for "
            f"'{program_name}'. Please reattempt the quiz."
        ),
    )

    db.add(notification)

    print(
        f"[RETENTION FAILED NOTIFICATION] CREATED "
        f"user={user_id}, quiz={quiz_id}, program={program_id}"
    )