import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyStatusCard } from "../MyStatusCard";

describe("MyStatusCard", () => {
  it("renders position, points, exacts, completion", () => {
    render(
      <MyStatusCard
        myStatus={{ position: 3, total: 42, exacts: 5, completion: 80, provisional: false }}
      />
    );
    expect(screen.getByText("3º")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("renders dash when position is null", () => {
    render(
      <MyStatusCard
        myStatus={{ position: null, total: 0, exacts: 0, completion: 0, provisional: false }}
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders loading state when null", () => {
    render(<MyStatusCard myStatus={null} />);
    expect(screen.getByText(/Carregando/)).toBeInTheDocument();
  });

  it("calls onSeeAll", () => {
    const onSeeAll = vi.fn();
    render(
      <MyStatusCard
        myStatus={{ position: 1, total: 0, exacts: 0, completion: 0, provisional: false }}
        onSeeAll={onSeeAll}
      />
    );
    fireEvent.click(screen.getByText(/Ver palpites/));
    expect(onSeeAll).toHaveBeenCalled();
  });
});
