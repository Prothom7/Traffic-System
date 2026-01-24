'use client';

const vehicles = [
  { id: 1, plate: "DHAKA-1234", owner: "Abdul Alim" },
  { id: 2, plate: "CTG-5678", owner: "Joynul Abedin" },
];

export default function VehiclesPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Registered Vehicles</h1>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Number Plate</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.plate}</td>
              <td>{v.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
