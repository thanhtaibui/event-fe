/**
 * Type inference tests for DatePicker onChange callback
 *
 * These tests verify that TypeScript can properly infer the type of the
 * onChange callback parameter without explicit type annotations.
 *
 * Related issues:
 * - #6202: onChange type breaks after updating to 9.1.0
 * - #6131: selectsMultiple prop type incompatibility when spreading props
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react";

import DatePicker from "../index";
import { safeQuerySelector } from "./test_utils";

describe("DatePicker onChange type inference", () => {
  it("should infer Date | null for single date picker without explicit type annotation", () => {
    // This test verifies fix for issue #6202
    // If TypeScript cannot infer the type, this test will fail to compile
    let selectedDate: Date | null = null;

    const { container } = render(
      <DatePicker
        selected={selectedDate}
        // The key test: NO explicit type annotation on `date` parameter
        // TypeScript should infer `date` as `Date | null`
        onChange={(date) => {
          // If type inference works, this assignment should compile without error
          selectedDate = date;
        }}
      />,
    );

    const input = safeQuerySelector<HTMLInputElement>(container, "input");
    fireEvent.change(input, { target: { value: "01/01/2024" } });

    expect(selectedDate).not.toBeNull();
  });

  it("should infer [Date | null, Date | null] for range picker without explicit type annotation", () => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const { container } = render(
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        // The key test: NO explicit type annotation on `dates` parameter
        // TypeScript should infer `dates` as `[Date | null, Date | null]`
        onChange={(dates) => {
          // If type inference works, destructuring should work without error
          const [start, end] = dates;
          startDate = start;
          endDate = end;
        }}
      />,
    );

    const input = safeQuerySelector<HTMLInputElement>(container, "input");
    fireEvent.change(input, { target: { value: "01/01/2024" } });

    expect(startDate).not.toBeNull();
  });

  it("should infer Date[] | null for multiple picker without explicit type annotation", () => {
    let selectedDates: Date[] | null = null;

    const { container } = render(
      <DatePicker
        selectsMultiple={true}
        selectedDates={selectedDates ?? []}
        // The key test: NO explicit type annotation on `dates` parameter
        // TypeScript should infer `dates` as `Date[] | null`
        onChange={(dates) => {
          // If type inference works, this assignment should compile without error
          selectedDates = dates;
        }}
      />,
    );

    const input = safeQuerySelector<HTMLInputElement>(container, "input");
    fireEvent.change(input, { target: { value: "01/01/2024" } });

    // Multiple picker doesn't respond to text input the same way, just verify render
    expect(container.querySelector("input")).toBeTruthy();
  });
});
