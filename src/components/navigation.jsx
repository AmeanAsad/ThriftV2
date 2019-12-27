import React, { Component } from 'react';
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import "./css/login.css";

class Navigation extends Component {
    state = {}
    render() {
        return (
            <div>

                <Navbar bg="light" variant="light">
                    <Navbar.Brand className="brand" >Thrift</Navbar.Brand>
                    <Nav className="mr-auto">
                        <Link to='/'>  <Nav.Link className="nav-item" href="#home">Home</Nav.Link></Link>
                    </Nav>
                </Navbar>
            </div>

        );
    }
}

export default Navigation;