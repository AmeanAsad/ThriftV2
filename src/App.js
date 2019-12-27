import React from 'react';
import logo from './logo.svg';
import './App.css';
import "bootstrap/dist/css/bootstrap.css";
import {
  //  Replace Hash with BrowserRouter if server fails
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import Credentials from "./components/login"
import HomepagemMain from "./components/homepage"

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/" exact component={Credentials} />
          <Route path="/home" exact component={HomepagemMain} />

        </Switch>
      </Router >
    </div>
  );
}

export default App;
