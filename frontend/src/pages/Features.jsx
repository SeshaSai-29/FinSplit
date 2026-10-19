import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Users, 
  Target, 
  PieChart, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  HelpCircle 
} from 'lucide-react';

export default function Features({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'scenarios' | 'faq'
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeScenario, setActiveScenario] = useState('budget'); // 'budget' | 'expense' | 'settle'

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* HERO SECTION */}
      <div className="features-hero" style={{
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface-elevated) 100%)',
        border: '1px solid var(--border-base)',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '0.85rem',
          lineHeight: 1.2
        }}>
          How <span style={{ color: 'var(--brand-primary)' }}>FinSplit</span> works
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: '780px',
          margin: '0 auto 1.75rem auto',
          lineHeight: 1.6
        }}>
          FinSplit combines personal cash flow management with collaborative group expense splitting. Understand our budgeting logic, group calculations, and settlement handling.
        </p>

        {/* Quick Nav Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'rules' ? 'active-pill' : ''}`}
            onClick={() => setActiveTab('rules')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderColor: activeTab === 'rules' ? 'var(--brand-primary)' : 'var(--border-color)',
              background: activeTab === 'rules' ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)'
            }}
          >
            Financial logic & transaction handling
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'scenarios' ? 'active-pill' : ''}`}
            onClick={() => setActiveTab('scenarios')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderColor: activeTab === 'scenarios' ? 'var(--brand-primary)' : 'var(--border-color)',
              background: activeTab === 'scenarios' ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)'
            }}
          >
            <Layers size={18} style={{ color: 'var(--brand-primary)' }} />
            Interactive scenarios
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'faq' ? 'active-pill' : ''}`}
            onClick={() => setActiveTab('faq')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '24px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderColor: activeTab === 'faq' ? 'var(--brand-primary)' : 'var(--border-color)',
              background: activeTab === 'faq' ? 'var(--brand-primary-subtle)' : 'var(--bg-surface)'
            }}
          >
            <HelpCircle size={18} style={{ color: 'var(--brand-primary)' }} />
            Frequently asked questions
          </button>
        </div>
      </div>

      {/* FEATURE PILLARS SUMMARY */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--brand-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
            <Wallet size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Personal dashboard</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Log personal income and expenses, configure monthly budget targets with live progress tracking, and filter transactions by exact month and year.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
            <Users size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Group splitting</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Create shared groups with friends, roommates, or trip mates. Split expenses equally or with custom amounts and track who owes whom in real-time.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
            <Target size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Group budgets</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Add group income to define spending limits for trips or shared events without polluting individual personal incomes.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
            <PieChart size={22} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Financial analytics</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Interactive charts, savings rate meters, category budget utilization thresholds, month-over-month spending comparisons, and trailing averages.
          </p>
        </div>
      </div>

      {/* TAB 1: FINANCIAL LOGIC & TRANSACTION HANDLING */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="section-header" style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Financial Logic & Transaction Handling
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              FinSplit is designed with clear accounting boundaries to keep personal finances and shared group balances independent and transparent.
            </p>
          </div>

          {/* 1. GROUP INCOME AS BUDGET */}
          <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', marginRight: '0.5rem' }}>
                1.
              </span>
              <h3 style={{ display: 'inline', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Group income is treated as a budget, not personal spend or income
              </h3>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              When a member logs an income transaction inside a group (or sets a group budget), that amount increases the group’s total budget. It is never reflected in any member's personal dashboard as an expense or personal income.
            </p>

            {/* Example Box */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              padding: '1.25rem',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                Example: Goa vacation fund (₹10,000 budget)
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Suppose User A creates a group for a weekend trip and adds ₹10,000 as group income.
                <br />
                • In the group dashboard: The budget shows ₹10,000 total.
                <br />
                • In User A's personal dashboard: ₹0 is recorded. User A hasn’t actually spent any money yet—they simply set their spending capacity for the trip.
                <br />
                • When User A later buys flight tickets for ₹4,000, that ₹4,000 expense is what gets synced and added on their personal dashboard as an expense.
              </p>
            </div>

            {/* Why Box */}
            <div style={{
              background: 'var(--brand-primary-subtle)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              border: '1px solid var(--brand-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', marginBottom: '0.25rem' }}>
                Why is it built this way?
              </strong>
              Budget is simply the spending limit you decided for that specific group, meaning you haven't actually spent anything yet. Your actual expenses may exceed or not even reach it.
            </div>
          </div>

          {/* 2. GROUP SPLITS CALCULATION ACROSS TRANSACTIONS */}
          <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', marginRight: '0.5rem' }}>
                2.
              </span>
              <h3 style={{ display: 'inline', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                How group splits and debts are calculated across all transactions
              </h3>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Group splits are calculated by taking into account all transaction splits across the group. When members add shared expenses, each transaction records who paid the amount and how that cost is split among the group members (either equally or through custom splits).
              <br /><br />
              FinSplit aggregates all transaction splits across the entire history of the group to calculate net balances:
              <br />
              • For each expense, the person who paid is credited with paying for the group.
              <br />
              • Each participating member is assigned their respective split share as an owed amount.
              <br />
              • FinSplit continuously offsets all splits against each other across all transactions, determining who owes whom or if members are completely settled up.
            </p>

            {/* Example Box */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              padding: '1.25rem',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                Example: Multiple shared expenses
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Suppose User A pays ₹3,000 for dinner split equally among User A, User B, and User C (₹1,000 each). Later, User B pays ₹1,500 for groceries split equally among the three (₹500 each):
                <br />
                • From the dinner transaction, User B owes User A ₹1,000 and User C owes User A ₹1,000.
                <br />
                • From the grocery transaction, User A owes User B ₹500 and User C owes User B ₹500.
                <br />
                • Combined net calculation: taking both transaction splits into account, User B only owes User A ₹500 (₹1,000 - ₹500), and User C owes User A ₹1,000 and User B ₹500.
              </p>
            </div>

            {/* Why Box */}
            <div style={{
              background: 'var(--brand-primary-subtle)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              border: '1px solid var(--brand-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', marginBottom: '0.25rem' }}>
                Why is it built this way?
              </strong>
              Taking into account all transaction splits together simplifies group finances. Instead of members making separate payments for every single purchase, FinSplit offsets all splits to minimize transactions and show the exact net amount owed.
            </div>
          </div>

          {/* 3. SETTLEMENT ASYMMETRY */}
          <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--brand-primary)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', marginRight: '0.5rem' }}>
                3.
              </span>
              <h3 style={{ display: 'inline', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Debt settlements reflect in the payer's dashboard, but not in the receiver's dashboard
              </h3>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              When User A settles a debt with User B:
              <br />
              • The transaction is automatically logged in User A's (the payer's) personal dashboard as an expense.
              <br />
              • It is not automatically added to User B's (the receiver's) personal dashboard unless B chooses to manually log it.
              <br />
              • Both debts owed and settlement payments are not added to the receiver's personal dashboard.
            </p>

            {/* Step-by-Step Flow Matrix */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Payer (User A - settling debt)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Assuming User A paid money to User B in real life and logged the transaction, FinSplit logs a ₹1,500 outgoing expense in User A's personal dashboard.
                </p>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Receiver (User B - receiving money)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  The payment is not added in User B's personal dashboard unless User B verifies and logs the transaction.
                </p>
              </div>
            </div>

            {/* Why Box */}
            <div style={{
              background: 'var(--brand-primary-subtle)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              border: '1px solid var(--brand-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', marginBottom: '0.25rem' }}>
                Why are incoming debts/settlements not auto-added as income?
              </strong>
              This is done in order to not have other users control a user's own personal dashboard. The payers may have paid or not paid the amount but from their perspective they did. So, only payer's personal dashboard is affected.
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: INTERACTIVE SCENARIOS */}
      {activeTab === 'scenarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <div className="section-header">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Real-world scenarios walkthrough
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Select a scenario below to see how FinSplit handles group events, splits, and settlements step-by-step.
            </p>
          </div>

          {/* Scenario Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`filter-preset-btn ${activeScenario === 'budget' ? 'filter-preset-btn--active' : ''}`}
              onClick={() => setActiveScenario('budget')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              1. Trip budget setup
            </button>
            <button
              type="button"
              className={`filter-preset-btn ${activeScenario === 'expense' ? 'filter-preset-btn--active' : ''}`}
              onClick={() => setActiveScenario('expense')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              2. Shared group expenses and splits
            </button>
            <button
              type="button"
              className={`filter-preset-btn ${activeScenario === 'settle' ? 'filter-preset-btn--active' : ''}`}
              onClick={() => setActiveScenario('settle')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              3. Settling up debts
            </button>
          </div>

          {/* SCENARIO 1: TRIP BUDGET */}
          {activeScenario === 'budget' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Scenario 1: Setting up a ₹25,000 trip budget
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    1
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Alice creates group "Manali Trip 2026"</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      Alice invites Bob and Charlie to the group via their unique group code.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    2
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Alice adds ₹25,000 as group income (budget)</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      The group now has a ₹25,000 spending target visible in the group dashboard.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    3
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Personal dashboard state: untouched</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      Alice's personal dashboard still shows ₹0 recorded. She has not actually spent any money yet—she simply set the spending capacity for the trip.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>Key takeaway:</strong> Budget is simply the spending limit decided for that specific group, meaning you haven't actually spent anything yet.
              </div>
            </div>
          )}

          {/* SCENARIO 2: SHARED EXPENSES & MULTIPLE SPLITS */}
          {activeScenario === 'expense' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Scenario 2: Calculating splits across multiple group expenses
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    1
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Bob pays ₹6,000 for dinner</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      Bob adds a group expense for ₹6,000 split equally among Alice, Bob, and Charlie (₹2,000 each). Bob's personal dashboard records the ₹6,000 expense he paid.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    2
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Alice pays ₹1,500 for groceries</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      Alice adds a group expense for ₹1,500 split equally among Alice, Bob, and Charlie (₹500 each). Alice's personal dashboard records the ₹1,500 expense she paid.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    3
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>FinSplit aggregates splits across both transactions</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      Instead of treating transactions separately, FinSplit offsets Alice's debt to Bob (₹2,000) against Bob's debt to Alice (₹500).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    4
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Group dashboard calculates the final net balance</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      The group dashboard displays that Alice only owes Bob ₹1,500, Charlie owes Bob ₹2,000 and Alice ₹500, and Bob is net owed ₹3,500.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>Key takeaway:</strong> Taking into account all transaction splits together minimizes back-and-forth transfers and provides an accurate net summary.
              </div>
            </div>
          )}

          {/* SCENARIO 3: SETTLING DEBT */}
          {activeScenario === 'settle' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Scenario 3: Alice settles debt with Bob
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    1
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Alice pays Bob ₹1,500 in real life</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      Alice transfers ₹1,500 to Bob via UPI or cash and logs the settlement in FinSplit.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    2
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Alice's personal dashboard: logs ₹1,500 expense</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      FinSplit logs a ₹1,500 outgoing expense in Alice's personal dashboard to reflect her real-life payment.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    3
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Bob's personal dashboard: not automatically added</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      The payment is not added in Bob's personal dashboard unless Bob verifies and logs the transaction.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    4
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Group dashboard clears debt</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                      The group owing calculation updates: Alice's debt to Bob is now cleared to ₹0.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>Key takeaway:</strong> Settlement affects only the payer's personal dashboard so that other users do not control a user's personal financial records.
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: FAQ SECTION */}
      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="section-header" style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Frequently asked questions
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Everything you need to know about navigating FinSplit.
            </p>
          </div>

          {[
            {
              q: 'Why does my group income not show in my personal total income?',
              a: 'Group income is designed strictly as a budget or spending limit for that specific group (such as a vacation budget or monthly apartment fund). Budget is simply the spending limit you decided for that specific group, meaning you haven\'t actually spent anything yet.'
            },
            {
              q: 'How does FinSplit calculate group splits across multiple expenses?',
              a: 'FinSplit calculates splits by taking into account all transaction splits across the group. For each shared expense, the payer is credited and each member is assigned their split share. FinSplit offsets all of these splits continuously so members only ever need to settle the final net difference.'
            },
            {
              q: 'When someone settles a debt with me, why is it not in my personal dashboard?',
              a: 'This is done in order to not have other users control a user\'s own personal dashboard. The payers may have paid or not paid the amount, but from their perspective they did. Only the payer\'s personal dashboard is affected unless you verify and log the transaction yourself.'
            },
            {
              q: 'How does the month and year filter in personal dashboard work?',
              a: 'The filter uses transaction timestamps. You can select any specific year or month to view only transactions that occurred during that period. The balance cards (total income, total expenses, net balance) immediately update in real-time to match the selected time window.'
            },
            {
              q: 'How do I set up my personal monthly budget limit?',
              a: 'Navigate to Profile Settings via the top navigation bar or the avatar dropdown. Under personal budget target, you can set your desired monthly limit. Your personal dashboard and analytics pages will automatically track your spending against this target.'
            }
          ].map((item, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={index}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}
                onClick={() => toggleFaq(index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {item.q}
                  </h4>
                  <div style={{ color: 'var(--brand-primary)' }}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                {isOpen && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.85rem',
                    marginBottom: 0,
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.85rem'
                  }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* BOTTOM CTA CALLOUT */}
      <div className="glass-card" style={{
        marginTop: '3rem',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Ready to manage your finances?
        </h3>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '550px', margin: 0 }}>
          Jump right in to start tracking personal expenses, setting budget goals, or creating shared groups with friends.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/home')}
            style={{ padding: '0.7rem 1.5rem', fontSize: '0.92rem' }}
          >
            Go to Home
            <ArrowRight size={16} />
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '0.7rem 1.5rem', fontSize: '0.92rem' }}
          >
            Personal Dashboard
          </button>
        </div>
      </div>

    </div>
  );
}
