import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {Profile, Inventory, Payout, PayoutHistory } from './components'; 
import { Layout } from './layout';
import { Login } from './components/login';
import { Signup } from './components/signup';
import { ProtectedRoute } from './components/protectedRoute';
import { useContext } from 'react';


function App() {
    const userId = localStorage.getItem("userId"); 

return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                    <Route index element={<Profile userId={userId} />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="payout" element={<Payout />} />
                        <Route path="payouthistory" element={<PayoutHistory />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
)
}

export { App };
