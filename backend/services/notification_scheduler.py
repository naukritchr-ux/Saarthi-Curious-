from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import time

from database import SessionLocal
from email_service import send_notification_email
from models import (
    User,
    NotificationScript,
    UserNotification,
    NotificationScriptRecipient,
    Program,
    Module,
    ModuleCompletion,
    UserProgramProgress,
    RetentionQuiz,
    ApplicationCheck,
)


def send_scheduled_notifications():

    db: Session = SessionLocal()
    # Store emails until the database transaction succeeds
    emails_to_send = []
    try:

        now = datetime.now()

        current_time = now.strftime("%H:%M")
        current_date = now.date()
        print("\n====================================")
        print("Scheduler Running")
        print("Current Time:", current_time)
        print("Current Date:", current_date)
        print("====================================")

        scripts = (
            db.query(NotificationScript)
            .filter(NotificationScript.is_active == True)
            .all()
        )

        print("Total Active Scripts:", len(scripts))

        today_start = datetime(
            now.year,
            now.month,
            now.day
        )

        tomorrow_start = today_start + timedelta(days=1)

        for script in scripts:

            print("--------------------------")
            print("Script ID:", script.id)
            print("Title:", script.title)
            print("Schedule Time:", script.schedule_time)
            print("Schedule Date:", script.schedule_date)

            # ==========================================
            # CHECK SCHEDULE TIME
            # ==========================================

            if not script.schedule_time:
                print("Skipped (Missing schedule_time)")
                continue

            scheduled_time = script.schedule_time.strftime("%H:%M")

            if scheduled_time != current_time:
                print("Skipped (Time Mismatch)")
                continue


            # ==========================================
            # CHECK SCHEDULE DATE
            # ==========================================

            if not script.schedule_date:
                print("Skipped (Missing schedule_date)")
                continue

            if script.schedule_date != current_date:
                print("Skipped (Date Mismatch)")
                continue

            print("Once script - date and time matched")
            # ==========================================
            # FIND USERS FROM RECIPIENTS
            # ==========================================

            users = []

            recipients = (
                db.query(NotificationScriptRecipient)
                .filter(
                    NotificationScriptRecipient.script_id == script.id
                )
                .all()
            )

            print("DEBUG SCRIPT ID:", script.id)

            all_recipients = db.query(NotificationScriptRecipient).all()

            print("DEBUG TOTAL RECIPIENT ROWS:", len(all_recipients))

            for r in all_recipients:
                print(
                    "DEBUG RECIPIENT:",
                    r.id,
                    r.script_id,
                    r.recipient_type,
                    r.recipient_value
                )

            print(
                "Recipients Found:",
                len(recipients)
            )

            for recipient in recipients:

                print(
                    "Recipient:",
                    recipient.recipient_type,
                    recipient.recipient_value
                )

                # ======================================
                # ALL USERS
                # ======================================

                if recipient.recipient_type == "all":

                    all_users = (
                        db.query(User)
                        .filter(
                            User.is_active == True,
                            User.role_id != 1,
                            User.role_id != 2
                        )
                        .all()
                    )

                    users.extend(all_users)

                # ======================================
                # ROLE
                # ======================================

                elif recipient.recipient_type == "role":

                    try:

                        role_id = int(
                            recipient.recipient_value
                        )

                        role_users = (
                            db.query(User)
                            .filter(
                                User.is_active == True,
                                User.role_id == role_id
                            )
                            .all()
                        )

                        users.extend(role_users)

                    except ValueError:

                        print(
                            "Invalid role:",
                            recipient.recipient_value
                        )

                # ======================================
                # SINGLE USER
                # ======================================

                elif recipient.recipient_type == "user":

                    try:

                        user_id = int(
                            recipient.recipient_value
                        )

                        user = (
                            db.query(User)
                            .filter(
                                User.user_id == user_id,
                                User.is_active == True
                            )
                            .first()
                        )

                        if user:
                            users.append(user)

                        else:
                            print(
                                "User not found:",
                                user_id
                            )

                    except ValueError:

                        print(
                            "Invalid user:",
                            recipient.recipient_value
                        )

            # ==========================================
            # REMOVE DUPLICATE USERS
            # ==========================================

            unique_users = {}

            for user in users:
                unique_users[user.user_id] = user

            users = list(unique_users.values())

            print(
                "Users Found:",
                len(users)
            )

            # Admin and Master Admin should not receive scheduled/general notifications
            # They receive only specific system notifications such as:
            # - Draft program pending
            # - Program published
            # - User completed program
            # - Future retention/application completion notifications

            users = [
                user for user in users
                if user.role_id not in [1, 2]
            ]

            # ==========================================
            # CREATE NOTIFICATIONS
            # ==========================================

            for user in users:

                # ======================================
                # CHECK IF ALREADY SENT
                # ======================================

                already_sent = (
                    db.query(UserNotification)
                    .filter(
                        UserNotification.user_id == user.user_id,
                        UserNotification.script_id == script.id
                    )
                    .first()
                )

                if already_sent:

                    print(
                        "Already Sent ->",
                        user.user_id
                    )

                    continue


                # ======================================
                # CREATE NOTIFICATION
                # ======================================

                print(
                    "Creating Notification ->",
                    user.user_id
                )

                notification = UserNotification(
                    user_id=user.user_id,
                    script_id=script.id,
                    title=script.title,
                    message=script.message,
                    sent_at=now
                )

                db.add(notification)


                # Prepare email after successful database commit
                if user.email:

                    emails_to_send.append({
                        "email": user.email,
                        "title": script.title,
                        "message": script.message
                    })

                    print(
                        f"Email queued for user "
                        f"{user.user_id}: {user.email}"
                    )
        db.commit()

        print(
            "Notifications Checked Successfully"
        )

        # ==========================================
        # SEND EMAILS AFTER SUCCESSFUL DB COMMIT
        # ==========================================

        for email_data in emails_to_send:

            try:
                email_sent = send_notification_email(
                    to_email=email_data["email"],
                    title=email_data["title"],
                    message=email_data["message"]
                )

                if email_sent:
                    print(
                        f"Notification email sent successfully to "
                        f"{email_data['email']}"
                    )
                else:
                    print(
                        f"Notification email FAILED to send to "
                        f"{email_data['email']}"
                    )

            except Exception as email_error:

                print(
                    f"Failed to send notification email to "
                    f"{email_data['email']}: {email_error}"
                )

            time.sleep(2)

    except Exception as e:

        db.rollback()

        print(
            "Scheduler Error:",
            e
        )

    finally:

        db.close()

def send_daily_learning_reminders():

    db: Session = SessionLocal()
    emails_to_send = []

    try:
        now = datetime.now()

        today_start = datetime(
            now.year,
            now.month,
            now.day
        )

        tomorrow_start = today_start + timedelta(days=1)

        print("\n====================================")
        print("Daily Learning Reminder Running")
        print("====================================")

        # Get all active learners only
        users = (
            db.query(User)
            .filter(
                User.is_active == True,
                User.role_id.notin_([1, 2])
            )
            .all()
        )

        for user in users:

            if not user.email:
                continue

            # ------------------------------------------
            # IMPORTANT:
            # Maximum ONE learning reminder per user/day
            # ------------------------------------------

            already_sent_today = (
                db.query(UserNotification)
                .filter(
                    UserNotification.user_id == user.user_id,
                    UserNotification.notification_type == "daily_learning_reminder",
                    UserNotification.sent_at >= today_start,
                    UserNotification.sent_at < tomorrow_start
                )
                .first()
            )

            if already_sent_today:
                print(
                    f"Learning reminder already sent today "
                    f"to user {user.user_id}"
                )
                continue

            # Get all programs where the user has
            # completed at least one module
            program_ids = (
                db.query(ModuleCompletion.program_id)
                .filter(
                    ModuleCompletion.user_id == user.user_id
                )
                .distinct()
                .all()
            )

            for (program_id,) in program_ids:
                program = (
                    db.query(Program)
                    .filter(Program.id == program_id)
                    .first()
                )

                if not program:
                    continue

                program_name = program.name

                # Total modules in program
                total_modules = (
                    db.query(Module)
                    .filter(
                        Module.program_id == program_id
                    )
                    .count()
                )

                if total_modules == 0:
                    continue

                # Completed modules
                completed_modules = (
                    db.query(ModuleCompletion)
                    .filter(
                        ModuleCompletion.user_id == user.user_id,
                        ModuleCompletion.program_id == program_id,
                        ModuleCompletion.is_completed == True
                    )
                    .count()
                )

                # Don't remind if program is completed
                if completed_modules >= total_modules:
                    continue

                remaining_modules = (
                    total_modules - completed_modules
                )

                # --------------------------------------
                # SELECT HARDCODED MESSAGE
                # --------------------------------------

                if remaining_modules == 1:

                    title = "You're Almost There! 🎉"

                    message = (
                        f"You're closer to completing '{program_name}'. "
                        "Continue learning today!"
                    )

                elif completed_modules == 2:

                    title = "Keep Going! 🚀"

                    message = (
                        f"You have completed 2 modules in '{program_name}'. "
                        "Keep going!"
                    )

                elif completed_modules == 1:

                    title = "Your Next Module Is Waiting 📚"

                    message = (
                        f"Your program '{program_name}' is waiting for you. "
                        "Complete your next module today!"
                    )

                else:

                    title = "Keep Your Learning Streak Alive 🔥"

                    message = (
                        f"Don't lose your learning streak in '{program_name}'. "
                        "Continue your program today!"
                    )

                # Save notification
                notification = UserNotification(
                    user_id=user.user_id,
                    script_id=None,
                    program_id=program_id,
                    title=title,
                    message=message,
                    notification_type="daily_learning_reminder",
                    sent_at=now
                )

                db.add(notification)

                emails_to_send.append({
                    "email": user.email,
                    "title": title,
                    "message": message
                })

                # IMPORTANT:
                # Send only ONE reminder per user per day,
                # even if user has multiple programs
                break

        # Save notifications first
        db.commit()

        print("Daily learning notifications saved")

        # Send emails after database commit
        for email_data in emails_to_send:

            try:
                send_notification_email(
                    to_email=email_data["email"],
                    title=email_data["title"],
                    message=email_data["message"]
                )

                print(
                    f"Learning reminder sent to "
                    f"{email_data['email']}"
                )

            except Exception as e:

                print(
                    f"Learning reminder email failed: {e}"
                )

            time.sleep(2)

    except Exception as e:

        db.rollback()

        print(
            "Daily Learning Reminder Error:",
            e
        )

    finally:

        db.close()

def send_retention_quiz_unlock_notifications():
    db = SessionLocal()

    try:
        today = datetime.now().date()

        completed_programs = (
            db.query(UserProgramProgress)
            .filter(
                UserProgramProgress.completed == True,
                UserProgramProgress.completed_at.isnot(None)
            )
            .all()
        )

        for progress in completed_programs:

            # Retention Quiz unlocks 15 days after program completion
            # Retention Quiz unlocks 15 days after program completion
            unlock_date = (
                progress.completed_at.date()
                + timedelta(days=15)
            )

            if today < unlock_date:
                continue

            retention_quiz = (
                db.query(RetentionQuiz)
                .filter(
                    RetentionQuiz.program_id == progress.program_id
                )
                .first()
            )

            if not retention_quiz:
                continue

            program = (
                db.query(Program)
                .filter(Program.id == progress.program_id)
                .first()
            )

            if not program:
                continue

            program_name = program.name

            # Check whether unlock notification was already sent
            existing_notification = (
                db.query(UserNotification)
                .filter(
                    UserNotification.user_id == progress.user_id,
                    UserNotification.program_id == progress.program_id,
                    UserNotification.retention_quiz_id
                    == retention_quiz.id,
                    UserNotification.title == "Retention Quiz Unlocked 🎉"
                )
                .first()
            )

            # Do not send duplicate notification
            if existing_notification:
                continue

            user = (
                db.query(User)
                .filter(User.user_id == progress.user_id)
                .first()
            )

            if (
                not user
                or not user.is_active
                or user.role_id in [1, 2]
            ):
                continue

            # Create website notification
            notification = UserNotification(
                user_id=user.user_id,
                title="Retention Quiz Unlocked 🎉",
                message=(
                    f"Your Retention Quiz for '{program_name}' has been unlocked. "
                    "Please complete it now."
                ),
                
                program_id=progress.program_id,
                retention_quiz_id=retention_quiz.id,
                script_id=None,
                is_read=False,
            )

            db.add(notification)
            db.commit()

            # Send email
            send_notification_email(
                to_email=user.email,
                title="Retention Quiz Unlocked 🎉",
                message=(
                    f"Your Retention Quiz for '{program_name}' has been unlocked. "
                    "Please log in and complete it now."
                )
            )

            print(
                f"Retention Quiz unlock notification sent "
                f"to user {user.user_id}"
            )

    except Exception as e:
        db.rollback()
        print(
            f"Retention Quiz Unlock Notification Error: {e}"
        )

    finally:
        db.close()


def send_application_check_unlock_notifications():
    db = SessionLocal()

    try:
        today = datetime.now().date()

        completed_programs = (
            db.query(UserProgramProgress)
            .filter(
                UserProgramProgress.completed == True,
                UserProgramProgress.completed_at.isnot(None)
            )
            .all()
        )

        for progress in completed_programs:

            # Get the user
            user = (
                db.query(User)
                .filter(User.user_id == progress.user_id)
                .first()
            )

            # Only active learners
            if (
                not user
                or not user.is_active
                or user.role_id in [1, 2]
            ):
                continue

            # Get program
            program = (
                db.query(Program)
                .filter(Program.id == progress.program_id)
                .first()
            )

            if not program:
                continue

            program_name = program.name

            # Get all Application Checks for this program
            application_checks = (
                db.query(ApplicationCheck)
                .filter(
                    ApplicationCheck.program_id == progress.program_id
                )
                .all()
            )

            for application_check in application_checks:

                # Use the existing unlock days from database
                unlock_days = application_check.unlock_after_days

                if not unlock_days:
                    # Fallback logic
                    if application_check.check_number == 1:
                        unlock_days = 30
                    elif application_check.check_number == 2:
                        unlock_days = 60
                    elif application_check.check_number == 3:
                        unlock_days = 90
                    else:
                        continue

                # Calculate unlock date
                unlock_date = (
                    progress.completed_at.date()
                    + timedelta(days=unlock_days)
                )

                if today < unlock_date:
                    continue

                check_number = application_check.check_number

                # Notification title
                title = f"Application Check {check_number} Unlocked 🎉"

                # Check duplicate notification
                existing_notification = (
                    db.query(UserNotification)
                    .filter(
                        UserNotification.user_id == user.user_id,
                        UserNotification.program_id == progress.program_id,
                        UserNotification.application_check_id
                        == application_check.id,
                        UserNotification.title == title
                    )
                    .first()
                )

                if existing_notification:
                    continue

                # Create website notification
                notification = UserNotification(
                    user_id=user.user_id,
                    title=title,
                    message=(
                        f"Application Check {check_number} for "
                        f"'{program_name}' has been unlocked. "
                        "Please complete it now."
                    ),
                    program_id=progress.program_id,
                    application_check_id=application_check.id,
                    script_id=None,
                    is_read=False,
                )

                db.add(notification)
                db.commit()

                # Send email
                if user.email:
                    send_notification_email(
                        to_email=user.email,
                        title=title,
                        message=(
                            f"Application Check {check_number} for "
                            f"'{program_name}' has been unlocked. "
                            "Please log in and complete it now."
                        )
                    )

                print(
                    f"Application Check {check_number} unlock "
                    f"notification sent to user {user.user_id}"
                )

    except Exception as e:
        db.rollback()
        print(
            f"Application Check Unlock Notification Error: {e}"
        )

    finally:
        db.close()