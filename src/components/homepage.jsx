import React, { Component } from 'react';


import PropTypes from "prop-types";
import axios from "axios";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import "./css/homepage.css";
import ListGroup from "react-bootstrap/ListGroup";
import Col from "react-bootstrap/Col";
import { Pie } from 'react-chartjs-2';
import Table from "react-bootstrap/Table";
import Navigation from './navigation'

class HomepageMain extends Component {
    state = {

        user: {},
        labels: [],
        data1: [],
        chart1: [],
        chart2: [],
        labels1: [],
        labels2: [],
        title1: "",
        title2: "",
        customer_id: "",
        savings: 0,
        periods: 0,
        categories: [],
        savingPlans: [],
        status: true,
    }
    static propTypes = {
        isAuthenticated: PropTypes.bool,
        user: PropTypes.object
    };

    componentDidMount() {
        const cus_id = this.props.location.state.customer_id
        console.log(cus_id)
        const config = {
            headers: {
                "Content-Type": "application/json"
            }
        };
        axios
            .post("http://127.0.0.1:8000/api/get/customer",
                { "customer_id": cus_id },
                config)
            .then(res => {
                const datu = res.data['result']
                this.setState({ user: datu })
            })
            .catch(err => {
                console.log("error")
            });
        axios
            .post("http://127.0.0.1:8000/api/get/analytics",
                { "customer_id": cus_id },
                config)
            .then(res => {
                const dat = res.data
                this.setState({
                    labels: dat['percentages'][0], data1: dat['percentages'][1],
                    chart1: dat["trends"][0]["data"], chart2: dat['trends'][1]["data"],
                    labels1: dat["trends"][0]["months"], labels2: dat["trends"][1]["months"],
                    title1: dat["trends"][0]["title"], title2: dat["trends"][1]["title"]

                })

            })
            .catch(err => {
                console.log("error")
            });
    }
    onChange = e => this.setState({ [e.target.name]: e.target.value });

    onSubmit = e => {
        e.preventDefault();
        const config = {
            headers: {
                "Content-Type": "application/json"
            }
        };
        const saving = this.state.savings
        const periods = this.state.periods
        const cus_id = this.props.location.state.customer_id


        axios
            .post("http://127.0.0.1:8000/api/post/savings",
                { "savings": saving, "periods": periods, "customer_id": cus_id },
                config)
            .then(res => {
                const dat = res.data
                this.setState({ savingPlans: dat['plans'], categories: dat['categories'] })
            })
            .catch(err => {
                console.log("error")
            });
    };


    render() {
        const data = {
            labels: this.state.labels,
            datasets: [{
                data: this.state.data1,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#BFD5E2',
                    '#38369A',
                    "#373F51",
                    '#A167A5',
                    '#157145',

                ],
                hoverBackgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56'
                ]
            }]
        };


        const savings = this.state.savings;

        const periods = this.state.periods;
        const table1 = [];
        const table2 = [];
        const table3 = [];
        const savingPlan = this.state.savingPlans;
        const savingCategories = this.state.categories;
        const denial = [];

        if (savingPlan[0] == 0) {
            this.state.status = false
        }
        if (this.state.status = false) {
            console.log('status denied')
            const d = (<p> This savings plan is not feasible, please increase period or reduce savings amount</p>)
            denial.push(d);
        } else {
            const denial = [];

        }
        for (var i = 0; i < savingPlan.length; i++) {


            const el = (
                <tr className="table">
                    <td>{savingCategories[i]}</td>
                    <td>{savingPlan[i]["avg_payment"]}</td>
                    <td>{savingPlan[i]["payments"]}</td>
                </tr>
            )

            const tb2 = (
                <tr className="table">
                    <td >{savingCategories[i]}</td>
                    <td>{savingPlan[i]["projected"]}</td>
                    <td>{savingPlan[i]["reduction"]}</td>
                    <td>{savingPlan[i]["budget"]}</td>

                </tr>)

            const tb3 = (
                <tr className="table">
                    <td>{savingCategories[i]}</td>
                    <td>{savingPlan[i]["monthly_budget"]}</td>


                </tr>)
            table1.push(el)
            table2.push(tb2)
            table3.push(tb3)


        }
        return (<div className='homepage-wrapper'>

            <div className="dimmer">


                <Navigation />
                <Row className="division-one">
                    <Col md className="profile-content">
                        <Card className="card-content1">
                            <Card.Header as="h5">  {this.state.user['surname']}  {this.state.user["givenName"]}</Card.Header>
                            <Card.Body>
                                <Card.Title>Welcome to your finance Dashboard</Card.Title>
                                <Card.Text>
                                    Review your financial history and examine your trends with Thrift
                            </Card.Text>
                                <div className="list-group">

                                    <ListGroup variant="flush">
                                        <ListGroup.Item>Income: {this.state.user['totalIncome']}$</ListGroup.Item>
                                        <ListGroup.Item>Monthly Income: {Math.round(this.state.user['totalIncome'] / 12)}$ </ListGroup.Item>
                                        <ListGroup.Item>Account: {this.state.user['type']} </ListGroup.Item>
                                        <ListGroup.Item>Age: {this.state.user['age']} </ListGroup.Item>
                                    </ListGroup>
                                </div>
                            </Card.Body>

                        </Card>
                    </Col>
                    <Col md className="percentage-content">


                        <Card className="card-2">
                            <Card.Body>
                                <Card.Title>Expenditure Averages</Card.Title>
                                <Card.Text>
                                    Here is a summary of your expenditure averages over your transaction history with the bank:
                            </Card.Text>
                                <Pie className="pie" data={data} />
                            </Card.Body>
                        </Card>

                    </Col>


                </Row>

                <Row className="justify-content-md-center">
                    <div className='card5'>


                        <Col md>
                            <div className="form-wrapper">
                                <div className="card card-body mt-8">

                                    <form onSubmit={this.onSubmit}>
                                        <div className="form-group">
                                            <label className="card3-text">Savings Amount</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="savings"
                                                onChange={this.onChange}
                                                value={savings}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="card3-text"> Period of Saving (Months)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="periods"
                                                onChange={this.onChange}
                                                value={periods}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <Button className="login-button" type="submit"
                                                variant='primary'>
                                                Optimize
                                 </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                        </Col>
                    </div>
                </Row>

                {denial}



                <Row className="card6">
                    <h1 className="header"> How it Works </h1>
                    <p className='text'> The optimizer will start by analyzing the spending habits of the customer. This step will identify
                        the different spending categories of the customer. Each category will then have an average payment
                        value and a frequency of payments per month value. The optimizer will prioritize spending categories
                        that have a high frequency and low average payments. The first table will output the amount of payments
                        need to be reduced in for each category over the whole amounting period in order to save the specified
                        amount.
                </p>
                    <Table striped bordered hover>
                        <thead>
                            <tr className="table">
                                <th >Spending Category</th>
                                <th >Average Payment</th>
                                <th >No of Payment Reductions </th>
                            </tr>
                        </thead>
                        <tbody>
                            {table1}
                        </tbody>
                    </Table>
                </Row>

                <Row className="card6">

                    <p className='text'> The next step is for the optimizer to use the previous transaction history to project how much the customer is expected to spend in each category, and hence how much should be deducted
                        from each category in order for the customer to save the specified amount. The table below outlines
                    these values. </p>
                    <Table className="table-hover" striped bordered hover>
                        <thead>
                            <tr className="table">
                                <th >Spending Category</th>
                                <th >Projected Spending</th>
                                <th> Required Reduction</th>
                                <th > Total Budget</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table2}
                        </tbody>
                    </Table>
                </Row>

                <Row className="card6">
                    <p className='text' > The final result, the one shown to a customer, is a table outlining the category of
                    spending and a monthly budget for that category. In order for the optimizer to work properly,
                    the customer should maintain their budgets for their other spending categories as predicted
                from their transaction history analysis.  </p>
                    <Table striped bordered hover>

                        <thead>
                            <tr className="table">
                                <th >Spending Category</th>
                                <th > Monthly Budget </th>
                            </tr>
                        </thead>
                        <tbody>
                            {table3}
                        </tbody>
                    </Table>
                </Row>
            </div>
        </div >);
    }
}

const mapStateToProps = state => ({
    user: state.auth.user
});

export default HomepageMain;
