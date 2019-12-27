import React, { Component } from "react";
import Form from "react-bootstrap/Form";
import { Link, Redirect } from "react-router-dom";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import PropTypes from "prop-types";
import { ValidatorForm } from "react-form-validator-core";
import TextValidator from "./textValidator";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import axios from "axios";
import Navigation from './navigation'
import "./css/login.css";


class Credentials extends Component {
    state = {
        td_id: "",
        redirect: false,
    }


    onSubmit = e => {

        const { td_id } = this.state;

        const request_data = { customer_id: td_id }
        const config = {
            headers: {
                "Content-Type": "application/json"
            }
        };
        axios
            .post("http://127.0.0.1:8000/api/get/customer",
                { customer_id: td_id },
                config)
            .then(res => {
                this.setState({ redirect: true });
                console.log("Worked")
            })
            .catch(err => {
                console.log("error")
            });
    };

    onChange = e => this.setState({ [e.target.name]: e.target.value });

    render() {

        const { td_id } = this.state;

        if (this.state.redirect) {
            return (<Redirect to={{
                pathname: "/home",
                state: { "customer_id": this.state.td_id }
            }} />)
        }


        return (<div className="login-wrapper">

            <div className="dimmer">


                <Navigation />
                <h1 style={{ marginTop: "3%" }} className="headers"> Welcome to Thrift! </h1>

                <div className="body1">

                    <h2 className="headers"> About </h2>
                    <p className="text"> A lot of banking apps provide users with insights and information on their spending. However, there
                        are almost no tools provided that make use of that data to help people. The main idea behind Thrift
                        was to take initiative in exploring how to use this available banking data to provide useful tools
                        for people to benefit from. The specific problem that Thrift tackles is how to help people save money
                        in an optimized way using the information provided by their banking history . Saving money is hard,
                        especially when you are trying to budget yourself. Thrift analyzes people's spending habits
                        and provides people with specific budget cuts to certain expenditures in order for them to be able
                        to save a desired amount of money.
            </p>

                </div>

                <Row style={{}} className="justify-content-md-center">
                    <Col md={{ span: 5 }}>
                        <Card className="card-wrapper">
                            <ValidatorForm ref="form" onSubmit={this.onSubmit}>
                                <Form style={{ padding: "5%", width: "100%" }}>

                                    <Form.Group >
                                        <Form.Label className="label"> TD-Bank ID </Form.Label>

                                        <TextValidator style={{ width: "70%" }}
                                            className="text-validator"
                                            onChange={this.onChange}
                                            name="td_id"
                                            value={td_id}
                                            validators={["required",]}
                                            errorMessages={[
                                                "This field is required",

                                            ]}
                                        />
                                    </Form.Group>

                                    <Button
                                        className="login-button"
                                        variant="primary"
                                        type="submit"
                                    >
                                        Submit
                            </Button>
                                </Form>
                            </ValidatorForm>
                        </Card>
                    </Col>
                </Row>

                <div className="body2">

                    <h2 className="headers"> Usage </h2>
                    <p className="text"> Thrift is built based upon an open source API provided by TD Bank called the <a href='https://td-davinci.com/'>Da-Vinci API</a>.
                    Therefore, unfortunately, Thrift only works for the customers provided by the API.
                    The API has over 1,000,000 sample customers, and to use app you can go to any of these customers
                        and insert the customer id in the form below.
            </p>
                    <p className="text"> Here are some random customer ID's if you wish to test the program</p>
                    <ul>
                        <li className="text" >49a3fce9-f20b-43bb-9616-492f9b7f14b4</li>
                        <li className="text"> 3bfcb514-35ab-44a9-81e3-3466c2ac7916</li>
                        <li className="text"> 4463d38b-9d3a-4eec-a30a-084e6317a59c</li>
                        <li className="text"> 1a2930bf-2895-4ac2-a371-bca525262543</li>
                    </ul>

                </div>
            </div>

        </div>);
    }
}

export default Credentials;