import { Plus, Terminal, X } from "lucide-react";
import { useAgentHarness } from "../../hooks/useAgentHarness";

export default function AgentHarnessDrawer() {
  const {
    isOpen,
    categories,
    sessions,
    activeCategoryId,
    activeAgentId,
    activeSessionId,
    activeCategory,
    activeAgent,
    activeSession,
    toggleDrawer,
    setCategory,
    setAgent,
    setSession,
    addSession,
    closeSession,
  } = useAgentHarness();

  return (
    <>
      <button
        type="button"
        className="harness-launcher"
        onClick={() => toggleDrawer(true)}
        aria-expanded={isOpen}
        aria-controls="studio-harness-drawer"
      >
        <Terminal size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Studio Hub</span>
      </button>

      <div
        className={`harness-backdrop ${isOpen ? "harness-backdrop--open" : ""}`}
        onClick={() => toggleDrawer(false)}
        aria-hidden={!isOpen}
      />

      <aside
        id="studio-harness-drawer"
        className={`harness-drawer ${isOpen ? "harness-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="William studio agent workspace"
        aria-hidden={!isOpen}
      >
        <header className="harness-header">
          <div className="harness-tabs" role="tablist" aria-label="Agent sessions">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                role="tab"
                aria-selected={session.id === activeSessionId}
                className={`harness-tab ${session.id === activeSessionId ? "harness-tab--active" : ""}`}
                onClick={() => setSession(session.id)}
              >
                <span className="harness-tab__label">{session.title}</span>
                {sessions.length > 1 ? (
                  <span
                    className="harness-tab__close"
                    role="button"
                    tabIndex={0}
                    aria-label={`Close ${session.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeSession(session.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        closeSession(session.id);
                      }
                    }}
                  >
                    <X size={12} aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            ))}
            <button
              type="button"
              className="harness-tab harness-tab--add"
              aria-label="Open new agent session"
              onClick={() => addSession(`${activeAgent?.name ?? "Agent"} Session`)}
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="harness-close"
            onClick={() => toggleDrawer(false)}
            aria-label="Close agent harness"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="harness-body">
          <nav className="harness-rail" aria-label="Agent categories">
            <p className="harness-rail__title">Categories</p>
            <ul className="harness-rail__list">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className={`harness-rail__category ${category.id === activeCategoryId ? "harness-rail__category--active" : ""}`}
                    onClick={() => setCategory(category.id)}
                  >
                    {category.label}
                  </button>
                  {category.id === activeCategoryId ? (
                    <ul className="harness-rail__agents">
                      {category.agents.map((agent) => (
                        <li key={agent.id}>
                          <button
                            type="button"
                            className={`harness-rail__agent ${agent.id === activeAgentId ? "harness-rail__agent--active" : ""}`}
                            onClick={() => setAgent(agent.id)}
                          >
                            <span>{agent.name}</span>
                            <span className="harness-rail__model">{agent.model}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <section className="harness-workspace" aria-label="Active agent session">
            <div className="harness-workspace__meta">
              <p className="harness-workspace__kicker">
                {activeCategory?.label ?? "Team"} / {activeAgent?.name ?? "Agent"}
              </p>
              <p className="harness-workspace__status">
                <span className="harness-workspace__dot" aria-hidden="true" />
                {activeSession?.status ?? "ready"}
              </p>
            </div>

            <div className="harness-terminal">
              <p className="harness-terminal__line">
                <span className="harness-terminal__prompt">william@studio</span>
                <span>session bind → {activeSession?.title ?? "-"}</span>
              </p>
              <p className="harness-terminal__line harness-terminal__muted">
                Model route: {activeAgent?.model ?? "-"} // context: salon workflow
              </p>
              <p className="harness-terminal__line">
                Awaiting command. Color consults, extension specs, and booking notes route here.
              </p>
            </div>

            <form
              className="harness-command"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label className="sr-only" htmlFor="harness-command-input">
                Agent command
              </label>
              <input
                id="harness-command-input"
                type="text"
                className="harness-command__input"
                placeholder={`Command ${activeAgent?.name ?? "agent"}…`}
                autoComplete="off"
              />
              <button type="submit" className="harness-command__submit">
                Run
              </button>
            </form>
          </section>
        </div>
      </aside>
    </>
  );
}
