export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// DUMMY DATA FOR DEVELOPMENT
export const DUMMY_PROGRAMS = {
  1: {
    id: 1,
    name: "Full Stack Web Development",
    description:
      "Complete guide to modern web development with React, Node.js, and MongoDB",
    category: "TECHNOLOGY",
    duration: "12 weeks",
    enrolled_count: 156,
    rating: 4.8,
    total_points: 1200,
    program_curos: 250,
    created_at: "2024-01-15",
    is_mandatory: true,
    modules: [
      {
        id: 101,
        name: "JavaScript Fundamentals",
        type: "Video",
        duration: "25 min",
        points: 15,
        description:
          "Learn the core concepts of JavaScript including variables, functions, and ES6 features.",
        completed: true,
      },
      {
        id: 102,
        name: "React Basics",
        type: "Video",
        duration: "30 min",
        points: 20,
        description:
          "Understand React components, props, state, and the virtual DOM.",
        completed: true,
      },
      {
        id: 103,
        name: "State Management with Redux",
        type: "Reading",
        duration: "20 min",
        points: 15,
        description:
          "Learn how to manage application state using Redux toolkit.",
        completed: true,
      },
      {
        id: 104,
        name: "Routing and Navigation",
        type: "Video",
        duration: "25 min",
        points: 15,
        description: "Implement client-side routing using React Router.",
        completed: true,
      },
      {
        id: 105,
        name: "API Integration",
        type: "Reading",
        duration: "35 min",
        points: 25,
        description:
          "Connect your React app to REST APIs and handle async operations.",
        completed: false,
      },
      {
        id: 106,
        name: "Authentication & Authorization",
        type: "Video",
        duration: "30 min",
        points: 20,
        description:
          "Implement JWT authentication and role-based access control.",
        completed: false,
      },
      {
        id: 107,
        name: "Database Design with MongoDB",
        type: "Reading",
        duration: "25 min",
        points: 15,
        description:
          "Design schemas and work with MongoDB for your applications.",
        completed: false,
      },
      {
        id: 108,
        name: "Deployment and CI/CD",
        type: "Video",
        duration: "40 min",
        points: 30,
        description:
          "Deploy your full-stack app to production and set up CI/CD pipelines.",
        completed: false,
      },
    ],
  },
  2: {
    id: 2,
    name: "Data Science & Machine Learning",
    description:
      "Master data analysis, visualization, and machine learning algorithms",
    category: "DATA SCIENCE",
    duration: "15 weeks",
    enrolled_count: 89,
    rating: 4.9,
    total_points: 1500,
    program_curos: 300,
    created_at: "2024-01-20",
    is_mandatory: true,
    modules: [
      {
        id: 201,
        name: "Python for Data Science",
        type: "Video",
        duration: "30 min",
        points: 20,
        description:
          "Master Python programming for data analysis and scientific computing.",
        completed: true,
      },
      {
        id: 202,
        name: "NumPy & Pandas",
        type: "Video",
        duration: "35 min",
        points: 25,
        description:
          "Learn data manipulation and analysis with NumPy and Pandas.",
        completed: true,
      },
      {
        id: 203,
        name: "Data Visualization",
        type: "Reading",
        duration: "25 min",
        points: 15,
        description:
          "Create compelling visualizations with Matplotlib and Seaborn.",
        completed: false,
      },
      {
        id: 204,
        name: "Machine Learning Basics",
        type: "Video",
        duration: "45 min",
        points: 30,
        description:
          "Introduction to machine learning concepts and algorithms.",
        completed: false,
      },
    ],
  },
};

// Dummy progress data
export const DUMMY_PROGRESS = {
  1: {
    completed_modules: [101, 102, 103, 104],
    current_module: 105,
    progress: 45,
    completed: false,
  },
  2: {
    completed_modules: [201, 202],
    current_module: 203,
    progress: 30,
    completed: false,
  },
};

// Flag to use dummy data
export const USE_DUMMY_DATA = false;