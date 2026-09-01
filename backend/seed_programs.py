"""
Database Seeding Script for Programs
Creates 5 mandatory and 8 optional programs with complete module structures
"""

import sys
import os

# Add the parent directory to the path to import database and models
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import (
    Program, Module, Video, WrittenLesson, Quiz, QuizQuestion,
    SurveyForm, SurveyQuestion, SurveyOption, Reward
)
from sqlalchemy.orm import Session

# Program Data
MANDATORY_PROGRAMS = [
    "Induction Training",
    "Naukri Training", 
    "Saarthi 360 Training",
    "Saarthi Q Training",
    "Hundred Day Success Program"
]

OPTIONAL_PROGRAMS = [
    "Advanced Sales Techniques",
    "Leadership Fundamentals",
    "Customer Service Excellence",
    "Time Management Mastery",
    "Effective Communication Skills",
    "Problem Solving Strategies",
    "Team Collaboration Basics",
    "Digital Marketing Essentials"
]

# Standard Quiz Questions (5 questions per quiz)
STANDARD_QUIZ_QUESTIONS = [
    {
        "question": "What is the primary objective of this training?",
        "options": [
            {"text": "Understand basic concepts", "isCorrect": False},
            {"text": "Master advanced techniques", "isCorrect": False},
            {"text": "Apply skills in real scenarios", "isCorrect": False},
            {"text": "All of the above", "isCorrect": True}
        ],
        "explanation": "This training covers all aspects from basic to advanced application.",
        "marks": 1
    },
    {
        "question": "Which of the following best describes the key learning point?",
        "options": [
            {"text": "Theoretical knowledge", "isCorrect": False},
            {"text": "Practical application", "isCorrect": False},
            {"text": "Both theory and practice", "isCorrect": True},
            {"text": "Neither", "isCorrect": False}
        ],
        "explanation": "The key learning point combines both theoretical understanding and practical application.",
        "marks": 1
    },
    {
        "question": "How would you apply this learning in your daily work?",
        "options": [
            {"text": "By reading more", "isCorrect": False},
            {"text": "By practicing regularly", "isCorrect": False},
            {"text": "By teaching others", "isCorrect": False},
            {"text": "All of the above", "isCorrect": True}
        ],
        "explanation": "Applying learning involves reading, practicing, and teaching others.",
        "marks": 1
    },
    {
        "question": "What is the most important takeaway from this module?",
        "options": [
            {"text": "Technical skills", "isCorrect": False},
            {"text": "Soft skills", "isCorrect": False},
            {"text": "Both technical and soft skills", "isCorrect": True},
            {"text": "None", "isCorrect": False}
        ],
        "explanation": "The most important takeaway is the combination of technical and soft skills.",
        "marks": 1
    },
    {
        "question": "How confident do you feel about applying what you learned?",
        "options": [
            {"text": "Very confident", "isCorrect": False},
            {"text": "Somewhat confident", "isCorrect": False},
            {"text": "Not very confident", "isCorrect": False},
            {"text": "Not confident at all", "isCorrect": False}
        ],
        "explanation": "This question helps assess your confidence level in applying the learned concepts.",
        "marks": 1
    }
]

# Standard Survey Questions (5 questions per survey)
STANDARD_SURVEY_QUESTIONS = [
    {
        "question": "How satisfied are you with this module's content?",
        "question_type": "multiple_choice",
        "is_required": True,
        "options": [
            {"option_text": "Very Satisfied", "option_order": 1},
            {"option_text": "Satisfied", "option_order": 2},
            {"option_text": "Neutral", "option_order": 3},
            {"option_text": "Dissatisfied", "option_order": 4},
            {"option_text": "Very Dissatisfied", "option_order": 5}
        ]
    },
    {
        "question": "Was the content relevant to your role?",
        "question_type": "multiple_choice",
        "is_required": True,
        "options": [
            {"option_text": "Yes", "option_order": 1},
            {"option_text": "No", "option_order": 2},
            {"option_text": "Partially", "option_order": 3}
        ]
    },
    {
        "question": "How would you rate the difficulty level?",
        "question_type": "multiple_choice",
        "is_required": True,
        "options": [
            {"option_text": "Too Easy", "option_order": 1},
            {"option_text": "Just Right", "option_order": 2},
            {"option_text": "Too Hard", "option_order": 3}
        ]
    },
    {
        "question": "What improvements would you suggest?",
        "question_type": "text",
        "is_required": False,
        "options": []
    },
    {
        "question": "Would you recommend this training to others?",
        "question_type": "multiple_choice",
        "is_required": True,
        "options": [
            {"option_text": "Yes", "option_order": 1},
            {"option_text": "No", "option_order": 2},
            {"option_text": "Maybe", "option_order": 3}
        ]
    }
]


def create_program(db: Session, name: str, program_type: str) -> Program:
    """Create a program with basic configuration"""
    program = Program(
        name=name,
        description=f"Comprehensive training program for {name.lower()}",
        type=program_type,
        duration="4 Hours",
        language="English",
        category="General",
        tags="training,learning,development",
        status="Published",
        unlock_type="Immediate",
        unlock_days=0,
        curos=0  # Program curos are awarded separately (20 curos on completion)
    )
    db.add(program)
    db.flush()
    return program


def create_module(db: Session, program_id: int, title: str, order: int) -> Module:
    """Create a module with 10 curos"""
    module = Module(
        program_id=program_id,
        title=title,
        description=f"Module covering {title.lower()}",
        module_order=order,
        curos=10  # 10 curos per module
    )
    db.add(module)
    db.flush()
    return module


def create_video(db: Session, module_id: int, title: str, order: int) -> Video:
    """Create a video with placeholder YouTube URL"""
    video = Video(
        module_id=module_id,
        title=title,
        youtube_url="https://www.youtube.com/watch?v=placeholder",
        description=f"Video lesson for {title}",
        subtitle=f"Subtitle for {title}",
        thumbnail_url="https://img.youtube.com/vi/placeholder/mqdefault.jpg",
        explanation_text=f"Detailed explanation for {title}",
        content_order=order
    )
    db.add(video)
    db.flush()
    return video


def create_written_lesson(db: Session, module_id: int, title: str, order: int) -> WrittenLesson:
    """Create a written lesson with placeholder content"""
    lesson = WrittenLesson(
        module_id=module_id,
        title=title,
        content=f"This is the written content for {title}. Please replace this with actual learning material.",
        pdf_url=None,
        is_active=True,
        content_order=order
    )
    db.add(lesson)
    db.flush()
    return lesson


def create_quiz(db: Session, module_id: int, title: str, order: int) -> Quiz:
    """Create a quiz with standard questions"""
    quiz = Quiz(
        module_id=module_id,
        title=title,
        description=f"Quiz to test your understanding of {title}",
        quiz_type="MCQ",
        unlock_type="Immediate",
        unlock_after_days=0,
        completion_deadline_days=0,
        curos_reward=0,
        content_order=order,
        passing_percentage=80
    )
    db.add(quiz)
    db.flush()
    
    # Add standard questions
    for idx, q_data in enumerate(STANDARD_QUIZ_QUESTIONS, 1):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=q_data["question"],
            explanation=q_data["explanation"],
            options=q_data["options"],
            question_order=idx,
            marks=q_data["marks"]
        )
        db.add(question)
    
    db.flush()
    return quiz


def create_survey(db: Session, module_id: int, title: str, order: int) -> SurveyForm:
    """Create a survey with standard questions"""
    survey = SurveyForm(
        module_id=module_id,
        title=title,
        description=f"Feedback survey for {title}",
        is_active=True,
        is_template=False,
        content_order=order
    )
    db.add(survey)
    db.flush()
    
    # Add standard questions
    for idx, q_data in enumerate(STANDARD_SURVEY_QUESTIONS, 1):
        question = SurveyQuestion(
            survey_id=survey.id,
            question=q_data["question"],
            question_type=q_data["question_type"],
            is_required=q_data["is_required"],
            question_order=idx
        )
        db.add(question)
        db.flush()
        
        # Add options for multiple choice questions
        if q_data["options"]:
            for opt_data in q_data["options"]:
                option = SurveyOption(
                    question_id=question.id,
                    option_text=opt_data["option_text"],
                    option_order=opt_data["option_order"]
                )
                db.add(option)
    
    db.flush()
    return survey


def create_reward(db: Session, program_id: int) -> Reward:
    """Create reward configuration for a program"""
    reward = Reward(
        program_id=program_id,
        video_completion_curos=0,
        program_completion_curos=20,  # 20 curos for program completion
        retention_quiz_curos=0,
        application_check_curos=0
    )
    db.add(reward)
    db.flush()
    return reward


def seed_programs():
    """Main seeding function"""
    db = next(get_db())
    
    try:
        print("Starting database seeding...")
        
        # Create mandatory programs
        print("\n=== Creating Mandatory Programs ===")
        for idx, program_name in enumerate(MANDATORY_PROGRAMS, 1):
            print(f"Creating mandatory program {idx}/5: {program_name}")
            
            program = create_program(db, program_name, "Mandatory")
            
            # Create 4 modules
            for module_idx in range(1, 5):
                module_title = f"Module {module_idx}: {program_name} - Part {module_idx}"
                print(f"  Creating module {module_idx}/4")
                module = create_module(db, program.id, module_title, module_idx)
                
                # Create video
                video = create_video(db, module.id, f"Video: {module_title}", 1)
                
                # Create written lesson
                lesson = create_written_lesson(db, module.id, f"Written: {module_title}", 2)
                
                # Create quiz
                quiz = create_quiz(db, module.id, f"Quiz: {module_title}", 3)
                
                # Create survey only in last module
                if module_idx == 4:
                    survey = create_survey(db, module.id, f"Survey: {program_name} Feedback", 4)
                    print(f"  Created survey in module 4")
            
            # Create reward configuration
            reward = create_reward(db, program.id)
            print(f"  Created reward configuration")
        
        # Create optional programs
        print("\n=== Creating Optional Programs ===")
        for idx, program_name in enumerate(OPTIONAL_PROGRAMS, 1):
            print(f"Creating optional program {idx}/8: {program_name}")
            
            program = create_program(db, program_name, "Optional")
            
            # Create 4 modules
            for module_idx in range(1, 5):
                module_title = f"Module {module_idx}: {program_name} - Part {module_idx}"
                print(f"  Creating module {module_idx}/4")
                module = create_module(db, program.id, module_title, module_idx)
                
                # Create video
                video = create_video(db, module.id, f"Video: {module_title}", 1)
                
                # Create written lesson
                lesson = create_written_lesson(db, module.id, f"Written: {module_title}", 2)
                
                # Create quiz
                quiz = create_quiz(db, module.id, f"Quiz: {module_title}", 3)
                
                # Create survey only in last module
                if module_idx == 4:
                    survey = create_survey(db, module.id, f"Survey: {program_name} Feedback", 4)
                    print(f"  Created survey in module 4")
            
            # Create reward configuration
            reward = create_reward(db, program.id)
            print(f"  Created reward configuration")
        
        # Commit all changes
        db.commit()
        print("\n=== Seeding Completed Successfully ===")
        print(f"Created {len(MANDATORY_PROGRAMS)} mandatory programs")
        print(f"Created {len(OPTIONAL_PROGRAMS)} optional programs")
        print(f"Total: {len(MANDATORY_PROGRAMS) + len(OPTIONAL_PROGRAMS)} programs")
        print(f"Each program has 4 modules with 10 curos per module")
        print(f"Each program awards 20 curos on completion")
        print(f"Total curos per program: 60 (4 modules × 10 + 20 program bonus)")
        
    except Exception as e:
        db.rollback()
        print(f"\n=== Error during seeding ===")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_programs()
