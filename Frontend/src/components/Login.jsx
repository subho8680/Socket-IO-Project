import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Formik, Form, ErrorMessage, Field, useFormikContext } from "formik"
import { Button, Input } from 'antd';

const Login = () => {
    const location = useLocation();
    const role = location.state?.role;
    console.log(role);
    const naviagte = useNavigate()

    const [type, settype] = useState("login")
    
    return (
        <div className='d2'>
            <div className=''>
                <Formik
                    initialValues={{
                        Email: "",
                        Password: "",
                        Name: ""
                    }}
                    validateOnBlur
                    onSubmit={(values, { setErrors }) => {
                    }}
                >
                    {({ values, handleChange, submitForm, handleBlur }) => {
                        return (
                            <Form className='px-5 md:p-0'>
                                <div className='flex flex-col gap-4 max-w-[500px] w-full m-auto mt-20 shadow-xl border border-gray-300 p-10 pt-5 rounded-2xl shadow-red-50 '>
                                    <h1 className='text-3xl text-center font-semibold'>
                                        {role === "teacher" ? "Teacher" : "Student"} {type === "login" ? "Login" : "Register"}
                                    </h1>

                                    <p className='text-center mb-5'>
                                        {type === "register" ? "Register Yourself" : "Sign in to Create and Manage Quizes"}
                                    </p>

                                    {type === "register" && (
                                        <div className="flex flex-col gap-3">
                                            <label className='text-[17px] font-semibold'>Name<span style={{ color: 'red' }}>*</span></label>
                                            <Input 
                                                placeholder="Enter Your Name"
                                                name='Name'
                                                value={values.Name}
                                                onChange={handleChange}
                                                style={{ padding: 10 }}
                                                onBlur={handleBlur}
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col gap-3">
                                        <label className='text-[17px] font-semibold'>Email<span style={{ color: 'red' }}>*</span></label>
                                        <Input 
                                            placeholder="Enter Your Email"
                                            name='Email'
                                            value={values.Email}
                                            onChange={handleChange}
                                            style={{ padding: 10 }}
                                            onBlur={handleBlur}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label className='text-[17px] font-semibold'>Password<span style={{ color: 'red' }}>*</span></label>
                                        <Input 
                                            placeholder="Enter Your Password"
                                            name='Password'
                                            value={values.Password}
                                            onChange={handleChange}
                                            style={{ padding: 10 }}
                                            onBlur={handleBlur}
                                            type="password"
                                        />
                                    </div>

                                    <Button type='primary' onClick={submitForm} style={{ width: "100%" }} size='large'>
                                        {type === "login" ? "Login" : "Register"}
                                    </Button>

                                    <div className='text-center mt-2'>
                                        {type === "login" ? (
                                            <p>Don't have an Account? <span className='text-red-600 cursor-pointer' onClick={() => settype("register")}>Register Here</span></p>
                                        ) : (
                                            <p>Already have an Account? <span className='text-red-600 cursor-pointer' onClick={() => settype("login")}>Login Here</span></p>
                                        )}
                                    </div>
                                </div>
                            </Form>
                        )
                    }}
                </Formik>
            </div>
        </div>
    )
}

export default Login