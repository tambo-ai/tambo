import { useState } from "react";

export default function DataTable() {
  const [data, setData] = useState([
    { id: 1, name: "Alice", age: 24 },
    { id: 2, name: "Bob", age: 28 },
    { id: 3, name: "Charlie", age: 22 }
  ]);
  const [sortAsc, setSortAsc] = useState(true);

  const sortByAge = () => {
    const sorted = [...data].sort((a, b) =>
      sortAsc ? a.age - b.age : b.age - a.age
    );
    setData(sorted);
    setSortAsc(!sortAsc);
  };

  return (
    <div>
      <button
        onClick={sortByAge}
        className="mb-2 px-3 py-1 rounded bg-blue-500 text-white"
      >
        Sort by Age
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td className="border p-2">{row.id}</td>
              <td className="border p-2">{row.name}</td>
              <td className="border p-2">{row.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
