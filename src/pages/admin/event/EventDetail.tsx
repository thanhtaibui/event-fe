import React from "react";
import "../../../styles/admin/event.css";
import { useParams } from "react-router-dom";
// import DashboardCard from "../../../components/dashboard/DashboardCard";

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return;
  const realId = atob(id);
  return (
    <div className="event-detail-container">
      {/* Top Header */}
      <div className="event-detail-header">
        <div>
          <h1 className="event-title">Lumina Creative Conference 2024</h1>
          <div className="status-badges">
            <span className="status-badge status-public">Public</span>
            <span className="status-badge status-confirmed">Confirmed</span>
          </div>
        </div>
        <button className="edit-btn">Edit Event</button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="main-layout">
        {/* Left Column - 70% */}
        <div className="left-column">
          {/* Hero Card */}
          <div className="hero-card">
            <div className="hero-preview">📊 Dashboard Preview</div>
          </div>

          {/* Event Description */}
          <div className="event-description">
            <h3 className="section-title">Event Description</h3>
            <p className="event-desc-text">
              Join us at Lumina Creative Conference 2024, where the world's top
              designers, developers, and creative directors gather to share the
              latest trends, tools, and techniques shaping the future of digital
              experiences. This year's theme explores the intersection of AI,
              immersive design, and sustainable creativity.
            </p>
          </div>

          {/* Info Section - 2 cards row */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <h4>Place</h4>
                <p>
                  Hilton Midtown Hotel
                  <br />
                  New York City, NY 10001
                </p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <h4>Date & Time</h4>
                <p>
                  October 15-17, 2024
                  <br />
                  Reg. deadline: Oct 1
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 30% */}
        <div className="right-column">
          {/* Ticket Types */}
          <div className="tickets-card">
            <h3 className="tickets-title">Ticket Types</h3>
            <div className="ticket-item">
              <div className="ticket-info">
                <h5>Early Bird</h5>
                <span className="ticket-status status-limited">
                  Only 12 left
                </span>
              </div>
              <div className="ticket-price">$99</div>
            </div>
            <div className="ticket-item">
              <div className="ticket-info">
                <h5>Standard</h5>
                <span className="ticket-status status-available">
                  Available
                </span>
              </div>
              <div className="ticket-price">$149</div>
            </div>
            <div className="ticket-item">
              <div className="ticket-info">
                <h5>VIP</h5>
                <span className="ticket-status status-soldout">Sold out</span>
              </div>
              <div className="ticket-price">$299</div>
            </div>
          </div>

          {/* Invite Summary */}
          <div className="invites-card">
            <div className="invites-number">1,247</div>
            <h3
              className="section-title"
              style={{ color: "#1e293b", marginBottom: "1rem" }}
            >
              Total Invitations
            </h3>
            <div className="invites-stats">
              <div className="stat-item">
                <div className="stat-label">Accepted</div>
                <div className="stat-value stat-accepted">68%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Pending</div>
                <div className="stat-value stat-pending">32%</div>
              </div>
            </div>
            <button className="manage-guests-btn">Manage Guest List</button>
          </div>

          {/* Revenue Forecast */}
          <div className="revenue-card">
            <div className="revenue-number">$124,750</div>
            <div className="revenue-currency">Forecasted Revenue</div>
            <div className="revenue-growth growth-positive">+18.5%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
