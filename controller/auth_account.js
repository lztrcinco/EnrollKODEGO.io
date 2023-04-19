const encrypt = require('bcrypt')
const JWT = require('jsonwebtoken')
//Database
const mySql = require('mysql2')
const db = mySql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT
})





exports.addAccount = (request, response) => {
    let { first_name, last_name, email, password, cPassword } = request.body

    first_name = first_name.trim().charAt(0).toUpperCase() + first_name.trim().slice(1);
    last_name = last_name.trim().charAt(0).toUpperCase() + last_name.trim().slice(1);

    function hasAtSymbol(email) {
        const symbol = /@/;
        return symbol.test(email)
    }

    if (password !== cPassword) {
        return response.render('register', { message: 'Password does not match'})
    }
    else if (password.length < 5) {
        return response.render('register', { message: 'Password needs to be longer than 5 characters'})
    }
    else if (first_name.length < 2) {
        return response.render('register', { message: 'First Name should be more than 2 letters'})
    }
    else if (last_name.length < 2) {
        return response.render('register', { message: 'Last Name should be more than 2 letters'})
    }
    else if (!hasAtSymbol(email)) {
        return response.render('register', { message: 'Invalid email format, should contain \'@\' symbol'})
    }
    else {
        db.query('SELECT email FROM users WHERE email = ?', email,
        async (error, result) => {
            if (error) {
                console.log(`Error has occured in SELECT Email part ${error}`)
            }
            else {
                if (result.length > 0) {
                    return response.render('register', { message: 'Email already existed. Try another one!'})
                }
                else {
                    const hashPassword = await encrypt.hash(password, 8)
                    console.log(hashPassword)
                    db.query('INSERT INTO users set ?', [{ first_name: first_name, last_name: last_name, email: email, password: hashPassword}],
                    (error, result) => {
                        if (error) {
                            console.log(`Error has occured in INSERTING in database ${error}`)
                        }
                        else {
                            console.log(result)
                            return response.render('login', { message: 'User account has been added'})
                        }
                    })
                }
            }
        })
    }
}

exports.loginAccount = async (request, response) => {
    try {
        const { email, password } = request.body

        if (email == '' || password == '') {
            return response.render('login', { message: 'Do not leave empty input fields'})
        }
        else {
            db.query('SELECT * from users WHERE email = ?', email, 
            async (error, result) => {
                if (error) {
                    console.log(`Error in Login ${error}`)
                }
                else if (!result[0]) {
                    return response.render('login', { message: 'Information field is incorrect. Try again!'})
                }
                else if (!(await encrypt.compare(password, result[0].password))) {
                    return response.render('login', { message: 'Information is incorrect'})
                }
                else {
                    const id = result[0].id;
                    const token = JWT.sign(id, process.env.JWT_SECRET);
                    const cookieOption = { expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES *24 *60 *1000), httpOnly: true}
                    response.cookie("cookie_access_token", token, cookieOption)
                    // db.query('SELECT * FROM students', 
                    // (error, data) => {
                    //     if (error) {
                    //         console.log(`Error SELECT ALL ${error}`)
                    //     }
                    //     else if (!result) {
                    //         return response.render('home', { message: 'There is no student'})
                    //     }
                    //     else {
                    //         return response.render('home', { studentTitle: 'List of Students', data: data})
                    //     }
                    // })
                    db.query('CALL enrolled_students()',
                    (error, result) => {
                        const data = result[0];
                        if (error) {
                            console.log(`Error in accessing courses ${courses}`)
                        }
                        else if (!data) {
                            return response.render('home', { message: 'There is no student'})
                        }
                        else {
                            return response.render('home', { studentTitle: 'List of Students', data: data})
                        }
                    })
                }
            })
        }
    }
    catch (error) {
        console.log(`Error in Login: ${err}`)
    }
}

exports.addStudent = (request, response) => {
    let { first_name, last_name, email, course_name, course_description } = request.body
    first_name = first_name.trim().charAt(0).toUpperCase() + first_name.trim().slice(1);
    last_name = last_name.trim().charAt(0).toUpperCase() + last_name.trim().slice(1);
    email = email.trim()
    course_name = course_name.trim().charAt(0).toUpperCase() + course_name.trim().slice(1);
    course_description = course_description.trim().charAt(0).toUpperCase() + course_description.trim().slice(1);
    if (first_name == '' || last_name == '' || email == '' || course_name == '' || course_description == '') {
        return response.render('addstudent', { message: 'The fields should not be empty'})
    }
    else {
        db.query('SELECT email FROM students where email = ?', email,
        (error, result) => {
            if (error) {
                console.log(`There is error on selecting the email in add students ${error}`)
            }
            else {
                if (result.length > 0) {
                    return response.render('addstudent', { message: 'Student already existed. Try another one!'})
                }
                else {
                    db.query('INSERT INTO courses (course_name, course_description) VALUES (?, ?)', [course_name, course_description], (error, courseResult) => {
                        if (error) {
                            console.log(`Error has occurred on inserting the course ${error}`);
                        } else {
                            const courseId = courseResult.insertId;
                    
                            // Insert a new student with the foreign key reference to the course
                            db.query('INSERT INTO students (first_name, last_name, email, course_id) VALUES (?, ?, ?, ?)', [first_name, last_name, email, courseId], (error, studentResult) => {
                                if (error) {
                                    console.log(`Error has occurred on inserting the student ${error}`);
                                } else {
                                    console.log(`Successfully inserted student and course with IDs ${studentResult.insertId} and ${courseId}`);
                                    // Call any other necessary database queries or render response here
                                    db.query('CALL enrolled_students()',
                                    (error, result) => {
                                        const data = result[0];
                                        if (error) {
                                            console.log(`Error in accessing courses ${courses}`)
                                        }
                                        else if (!data) {
                                            return response.render('home', { message: 'There is no student'})
                                        }
                                        else {
                                            return response.render('home', { studentTitle: 'List of Students', data: data})
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            }
        })
    }
}

exports.updateStudentForm = (request, response) => {
    try {
        const id = request.params.id;
        console.log(id)
        db.query('SELECT s.id, s.first_name, s.last_name, s.email, c.course_name, c.course_description FROM courses AS c INNER JOIN students AS s ON c.id = s.course_id WHERE s.id = ?;', id,
        (error, data) => {
            if (error) {
                console.log(`Error in updating the account ${error}`)
            }
            else {
                return response.render('updatestudent', {title: "Update Student Information", data: data[0]})
            }
        })
    }
    catch (error) {
        console.log(`Error in Update try and catch ${error}`)
    }
}

exports.updateStudent = (request, response) => {
    const { id, first_name, last_name, course_name, course_description } = request.body

    db.query('UPDATE students SET first_name = ?, last_name = ? WHERE id = ?', [first_name, last_name, id], 
    (error, result) => {
        if (error) {
            console.log(`There was an error on updating the user ${error}`)
        }
        else {
            db.query('UPDATE courses SET course_name = ?, course_description = ? WHERE id IN (SELECT course_id FROM students WHERE id = ?)', [course_name, course_description, id], 
            (error, data) => {
                if (error) {
                    console.log(`There was an error on updating the courses ${error}`)
                }
                else {
                    db.query('CALL enrolled_students()',
                    (error, result) => {
                        const data = result[0];
                        if (error) {
                            console.log(`Error in accessing courses ${courses}`)
                        }
                        else if (!data) {
                            return response.render('home', { message: 'There is no student'})
                        }
                        else {
                            return response.render('home', { studentTitle: 'List of Students', data: data, message: `The student has been updated with ID of ${id}`})
                        }
                    })
                }
            })
        }
    })
}

exports.deleteStudent = (request, response) => {
    const id = request.params.id;
    console.log(id)
    db.query('DELETE FROM students WHERE id = ?', [id],
    (error, result) => {
        if (error) {
            console.log(`The error has occured on deleting the student ${error}`)
        }
        else {
        db.query('CALL enrolled_students()',
            (error, result) => {
                const data = result[0];
                if (error) {
                    console.log(`Error in accessing courses ${courses}`)
                }
                else if (!data) {
                    return response.render('home', { message: 'There is no student'})
                }
                else {
                    return response.render('home', { studentTitle: 'List of Students', data: data, message: `The student with ID of ${id} has been deleted`})
                }
            })
        }
    })
}