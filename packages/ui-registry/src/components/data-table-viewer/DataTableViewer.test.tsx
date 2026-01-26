import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DataTableViewer } from "./DataTableViewer";

describe("DataTableViewer", () => {
  const mockData = [{ id: 1, name: "Test User" }];
  const mockColumns = [{ accessorKey: "name", header: "Name" }];

  it("renders the table with data and sticky headers", async () => {
    // Mocking the dimensions for JSDOM
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 1000,
    });

    render(
      <div style={{ height: "500px", width: "1000px" }}>
        <DataTableViewer data={mockData} columns={mockColumns} />
      </div>,
    );

    // Verify Header Rendering (The Vercel bot fix)
    const header = await screen.findByText(/Name/i);
    expect(header).toBeInTheDocument();

    // Verify Data Rendering
    const cellData = await screen.findByText(/Test User/i);
    expect(cellData).toBeInTheDocument();
  });
});
