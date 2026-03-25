// pages/TeacherDashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([
    {
      id: '1',
      title: 'JavaScript Basics',
      code: 'ABC123',
      status: 'completed',
      participants: 24,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'React Fundamentals',
      code: 'DEF456',
      status: 'active',
      participants: 18,
      createdAt: '2024-01-16',
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Create and manage your quiz sessions</p>
            </div>
            <button
              onClick={() => navigate('/teacher/create-quiz')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create New Quiz
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{quizzes.length}</div>
            <div className="text-gray-600">Total Quizzes</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">1</div>
            <div className="text-gray-600">Active Sessions</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">42</div>
            <div className="text-gray-600">Total Participants</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">94%</div>
            <div className="text-gray-600">Avg. Engagement</div>
          </div>
        </div>

        {/* Quiz List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Quizzes</h2>
          </div>
          <div className="divide-y">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      quiz.status === 'active' ? 'bg-green-500' : 
                      quiz.status === 'completed' ? 'bg-gray-400' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      <p className="text-gray-600">Code: {quiz.code} • {quiz.participants} participants</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {quiz.status === 'active' && (
                      <button
                        onClick={() => navigate(`/teacher/live/${quiz.id}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                      >
                        View Live
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/results/${quiz.id}`)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
                    >
                      View Results
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;