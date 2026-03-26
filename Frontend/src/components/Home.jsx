import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import {
  BookOutlined,
  TeamOutlined,
  RocketOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-16 w-16 h-16 bg-purple-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-indigo-200 rounded-full opacity-40 animate-ping"></div>

      <div className="w-full h-screen flex justify-center items-center px-4">
        <div className="w-full max-w-[1200px] m-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              QuizMaster AI
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform learning experiences with AI-powered quizzes and
              real-time competitions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-stretch">
            <div className="group relative flex flex-col h-full d3">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-8 bg-white rounded-2xl border border-gray-200 flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col gap-8">
                  <div className="flex justify-center">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <BookOutlined className="text-4xl text-blue-600" />
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold text-center text-gray-800">
                    I am a Teacher
                  </h1>

                  <div className="space-y-4">
                    <p className="text-center text-lg text-gray-600 leading-relaxed">
                      Create AI Powered Quizzes and engage your students in real
                      time
                    </p>
                    <div className="flex justify-center items-center gap-2 text-blue-500">
                      <RocketOutlined />
                      <span className="text-sm font-medium">
                        Smart Quiz Generation
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate("/login", { state: { role: "teacher" } })
                    }
                    size="large"
                    className="h-12 w-full text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 border-none hover:shadow-lg transition-all duration-300"
                    icon={<BookOutlined />}
                  >
                    Create Quiz
                  </Button>
                </div>
              </div>
            </div>

            <div className="group relative flex flex-col h-full d3">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-8 bg-white rounded-2xl border border-gray-200 flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col gap-8">
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-100 rounded-full">
                      <TeamOutlined className="text-4xl text-green-600" />
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold text-center text-gray-800">
                    I am a Student
                  </h1>

                  <div className="space-y-4">
                    <p className="text-center text-lg text-gray-600 leading-relaxed">
                      Join a Quiz with a Code and Compete with your classmates
                    </p>
                    <div className="flex justify-center items-center gap-2 text-green-500">
                      <TrophyOutlined />
                      <span className="text-sm font-medium">
                        Real-time Competition
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <Button
                    danger
                    onClick={() =>
                      navigate("/login", { state: { role: "student" } })
                    }
                    size="large"
                    className="h-12  w-full text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 border-none hover:shadow-lg transition-all duration-300"
                    icon={<TeamOutlined />}
                  >
                    Join Quiz
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <RocketOutlined className="text-blue-600 text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">AI Powered</h3>
              <p className="text-gray-600 text-sm">
                Smart quiz generation with artificial intelligence
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TeamOutlined className="text-purple-600 text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Real-time</h3>
              <p className="text-gray-600 text-sm">
                Live competition and instant results
              </p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrophyOutlined className="text-green-600 text-xl" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Engaging</h3>
              <p className="text-gray-600 text-sm">
                Fun and interactive learning experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
