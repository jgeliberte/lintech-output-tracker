const express = require("express");
const sha512 = require('js-sha512');
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const moment = require("moment");
const cors = require("cors");
const fetch = require("node-fetch");
const port = 6969;

const local = mysql.createPool({
    host: "192.168.150.112",
    user: "si",
    password: "softwareinfra",
    database: "commons_db"
});

// const local = mysql.createPool({
//     host: "127.0.0.1",
//     user: "softwareinfra",
//     password: "dynaslope2020",
//     database: "commons_db"
// });

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    local.query(`SELECT * FROM commons_db.user_accounts INNER JOIN users ON user_accounts.user_fk_id = users.user_id where username = '${username}' limit 1;`, (err, result) => {
        result.forEach(element => {
            if (element.password == sha512(password)) {
                res.send({
                    status: true,
                    message: "Login success!",
                    credentials: element
                });
            } else {
                res.send({
                    status: false,
                    message: "Login failed!"
                });
            }
        });
    });
});

app.post("/delete_task", (req, res) => {
    local.query('SET FOREIGN_KEY_CHECKS=0;', (err, result) => {
        local.query(`DELETE FROM commons_db.log_frame_output_activity WHERE output_id = ${req.body.output_id};`, (err, result) => {
            local.query(`DELETE FROM commons_db.log_frame_outputs WHERE output_id = ${req.body.output_id};`, (err, result) => {
                local.query('SET FOREIGN_KEY_CHECKS=1;', (err, result) => {
                    res.send({
                        status: true,
                        message: "Pfft. Sabi na eh.",
                    });
                });
            });
        });
    });
});

app.post("/save_task", (req, res) => {
    req.body.assigned_to.forEach(element => {
        let req_status = true;
        let query = `INSERT INTO log_frame_outputs VALUES (0, ${req.body.major_output.id}, ${element.user_id}, '${req.body.output_details}', 0, '${req.body.output_notes}', NULL);`
        local.query(query, (err, result) => {
            if (err) {
                req_status = false
            }
        });
        res.send({
            status: req_status,
            message: "Wow ha. Kala mo nag ttrabaho"
        });
    });
});

app.post("/start_timer", (req, res) => {
    let query = `SELECT * FROM commons_db.log_frame_output_activity where output_id = "${req.body.output_id}" order by id desc limit 1;`
    local.query(query, (err, result) => {
        let insert_activity_query = `INSERT INTO commons_db.log_frame_output_activity VALUES(0, ${req.body.output_id}, '${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}', null);`;
        local.query(insert_activity_query, (err, result) => {
            res.send({
                status: true
            })
        });
    });
});

app.post("/stop_timer", (req, res) => {
    let query = `SELECT * FROM commons_db.log_frame_output_activity where output_id = "${req.body.output_id}" order by id desc limit 1;`;
    local.query(query, (err, result) => {
        let update_ts = `UPDATE commons_db.log_frame_output_activity SET end_ts = '${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}' where id = '${result[0].id}'`;
        local.query(update_ts, (err, result) => {
            res.send({
                status: true
            })
        });
    });
});

app.get("/get_task_activity/:output_id", (req, res) => {
    let sub_query = `SELECT * FROM log_frame_output_activity WHERE output_id = ${req.params.output_id}`;
    local.query(sub_query, (err, sub_res) => {
        let activity = [];
        sub_res.forEach(el => {
            activity.push(el)
        });
        res.send({
            status: true,
            data: activity
        })
    });
});

app.post("/submit_task", (req,res) => {
    let update_ts = `UPDATE commons_db.log_frame_outputs SET status = 1 where output_id = '${req.body.output_id}'`;
    local.query(update_ts, (err, result) => {
        res.send({
            status: true,
            message: "Wow ha. Nag submit ka? Kala mo talaga nag ttrabaho."
        })
        let notify = `SELECT first_name, last_name FROM commons_db.users where user_id = '${req.body.user_id}'`;
        local.query(notify, (err, result) => {
            // webhook
            console.log(err, result)
        });
    });
});

app.post("/mark_as_done", (req,res) => {
    let update_ts = `UPDATE commons_db.log_frame_outputs SET status = 2 where output_id = '${req.body.output_id}'`;
    local.query(update_ts, (err, result) => {
        res.send({
            status: true,
            message: "Naks naman. Achiever!"
        })
    });
});

app.get("/get_tasks/:user_id/:category", (req, res) => {
    let query = "SELECT * FROM commons_db.log_frame " + 
                `INNER JOIN log_frame_outputs ON log_frame.id = log_frame_outputs.log_frame_id where log_frame_outputs.user_id = ${req.params.user_id} and log_frame_outputs.status = ${req.params.category};`;
    local.query(query, (err, result) => {
        let return_value = [];
        result.forEach(element => {
            let temp = {
                ...element
            };
            return_value.push(temp);
        });
        res.send({
            status: true,
            data: return_value
        });
    });
});

app.get("/get_major_outputs", (req, res) => {
    let query = "SELECT * FROM commons_db.log_frame;";
    local.query(query, (err, result) => {
        let return_value = [];
        result.forEach(element => {
            return_value.push(element);
        });
        res.send({
            status: true,
            data: return_value
        });
    });
});

app.get("/get_users", (req, res) => {
    let query = "SELECT user_id, first_name, last_name FROM commons_db.users INNER JOIN user_accounts ON users.user_id = user_accounts.user_fk_id;";
    local.query(query, (err, result) => {
        let return_value = [];
        result.forEach(element => {
            return_value.push({
                user_id: element.user_id,
                fullname: `${element.first_name} ${element.last_name}`
            });
        });
        res.send({
            status: true,
            data: return_value
        });
    });
});

app.post("/get_accomplished_outputs", (req, res) => {
    let query = `SELECT * FROM commons_db.log_frame_outputs INNER JOIN commons_db.log_frame ON log_frame_outputs.log_frame_id = log_frame.id where status > 0 and submitted_ts between '${req.body.ts_start}' and '${req.body.ts_end}' and user_id = ${req.body.user_id}`;
    local.query(query, (err, result) => {
        let return_value = [];
        result.forEach(element => {
            return_value.push({
                major_output: element.major_output,
                actual_output: element.actual_outputs,
                output_details: element.details
            });
        });
        res.send({
            status: true,
            data: return_value
        });
    });
});

app.get("/migrate_1", (req, res) => {
    let query = "ALTER TABLE `commons_db`.`log_frame_outputs` ADD COLUMN `submitted_ts` DATETIME NULL AFTER `details`;";
    local.query(query, (err, result) => {
        console.log("ERR:", err);
        let update_submitted_ts_query = "SELECT output_id from `commons_db`.`log_frame_outputs` where status > 0";
        local.query(update_submitted_ts_query, (err, result) => {
            result.forEach(el => {
                let update_ts = `UPDATE commons_db.log_frame_outputs SET submitted_ts = '${moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}' where output_id = '${el.output_id}'`;
                local.query(update_ts, (err, result) => {
                });
            });
        });
    });
});

function webhook(message) {
    console.log("TRIGGER THE HOOK")
    const webhookURL = 'https://chat.googleapis.com/v1/spaces/AAAAYxLNg1A/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=j1WQDuzXXv7zoiNUkhcqZdEkVw8tFnn_eUNbEzWjDqQ%3D';
  
    const data = JSON.stringify({
      'text': message,
    });
    let resp;

    fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: data,
    }).then((response) => {
      resp = response;
    });
    return resp;
  }


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});