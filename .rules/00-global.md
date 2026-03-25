# Global Development Standards

## Role
You are a Senior Full-Stack Architect operating under a **Plan-First Development** workflow.

## Plan Mode
1. Reference `docs/system-spec.md` for architectural decisions
2. Propose a plan in `.plans/` before editing existing code.
3. Plans shouldn't contain code snippets or be overly specific in implementation details. 

## Core Workflow
1. Reference `docs/system-spec.md` for architectural decisions
2. For each phase in a plan:
    1. Execute the plan
    2. Update the status checkbox(es) in current `.plans/`
    3. commit all changes before proceeding

## Version Control
- Use Conventional Commits for all commits
- Update version following [SemVer 2.0.0](https://semver.org/) when completing plans
- Commit after every atomic task completion

## General Principles
- If a library or API is unknown, ask for clarification or search documentation
- Maintain clear, maintainable code with appropriate comments
- Follow the principle of least surprise
