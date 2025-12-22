'use client';

import React from "react";
import styles from "./landing.module.css";

export default function VehicleHomePage() {
  const vehicle = {
    vehicle_id: 1,
    number_plate: "DHK-1234",
    owner_name: "John Doe",
    owner_contact: "john@email.com",
    owner_address: "Dhaka, Bangladesh",
    vehicle_type: "Car",
    model: "Toyota Corolla",
    year_of_manufacture: 2020,
    color: "White",
    engine_type: "Petrol",
    chassis_number: "CHS-998877",
    registration_date: "2021-01-10",
    registration_expiry: "2026-01-10",
    credit_score: 720,
    status: "Active"
  };

  const trafficRecords = [
    {
      record_id: 1,
      location: "Main Road Camera",
      timestamp: "2025-02-12 10:45",
      speed: 85,
      violation_type: "Speeding",
      severity: "Major",
      fine: 1500,
      status: "Unpaid"
    },
    {
      record_id: 2,
      location: "Signal Crossing",
      timestamp: "2024-11-03 18:20",
      speed: 0,
      violation_type: "Red Light",
      severity: "Minor",
      fine: 800,
      status: "Paid"
    }
  ];

  const unpaidFines = trafficRecords.filter(r => r.status === "Unpaid");

  return (
    <div className={styles.container}>

      <h1 className={styles.title}>Vehicle Dashboard</h1>

      <h2 className={styles.sectionTitle}>Vehicle Information</h2>
      <table className={styles.table}>
        <tbody>
          <tr><td>Number Plate</td><td className={styles.highlight}>{vehicle.number_plate}</td></tr>
          <tr><td>Owner</td><td>{vehicle.owner_name}</td></tr>
          <tr><td>Contact</td><td>{vehicle.owner_contact}</td></tr>
          <tr><td>Address</td><td>{vehicle.owner_address}</td></tr>
          <tr><td>Type</td><td>{vehicle.vehicle_type}</td></tr>
          <tr><td>Model</td><td>{vehicle.model}</td></tr>
          <tr><td>Year</td><td>{vehicle.year_of_manufacture}</td></tr>
          <tr><td>Color</td><td>{vehicle.color}</td></tr>
          <tr><td>Engine</td><td>{vehicle.engine_type}</td></tr>
          <tr><td>Chassis</td><td>{vehicle.chassis_number}</td></tr>
          <tr>
            <td>Status</td>
            <td className={styles.statusActive}>{vehicle.status}</td>
          </tr>
        </tbody>
      </table>

      <h2 className={styles.sectionTitle}>Registration Details</h2>
      <table className={styles.table}>
        <tbody>
          <tr><td>Registration Date</td><td>{vehicle.registration_date}</td></tr>
          <tr><td>Expiry Date</td><td>{vehicle.registration_expiry}</td></tr>
          <tr><td>Owner Credit Score</td><td>{vehicle.credit_score}</td></tr>
        </tbody>
      </table>

      <h2 className={styles.sectionTitle}>Recent Traffic Records</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Location</th>
            <th>Violation</th>
            <th>Severity</th>
            <th>Speed</th>
            <th>Fine</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {trafficRecords.map(record => (
            <tr key={record.record_id}>
              <td>{record.timestamp}</td>
              <td>{record.location}</td>
              <td>{record.violation_type}</td>
              <td>{record.severity}</td>
              <td>{record.speed}</td>
              <td>{record.fine}</td>
              <td
                className={
                  record.status === "Unpaid"
                    ? styles.statusUnpaid
                    : styles.statusPaid
                }
              >
                {record.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className={styles.sectionTitle}>Unpaid Fines</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Violation</th>
            <th>Date</th>
            <th>Location</th>
            <th>Fine Amount</th>
          </tr>
        </thead>
        <tbody>
          {unpaidFines.map(fine => (
            <tr key={fine.record_id}>
              <td>{fine.violation_type}</td>
              <td>{fine.timestamp}</td>
              <td>{fine.location}</td>
              <td className={styles.statusUnpaid}>{fine.fine}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
