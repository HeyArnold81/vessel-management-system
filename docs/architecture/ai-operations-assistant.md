# AI Operations Assistant

## Design

The AI Operations Assistant is a read-only assistant for operational and billing insight. It retrieves bounded summaries from approved Vessel Management System records and generates source-linked answers.

## MVP Scope

- Ask operational and billing questions.
- Summarise vessel calls, movements, movement services, and billing exceptions.
- Identify likely billing readiness issues.
- Refuse write-action requests.
- Return source links for every grounded answer.
- Record audit metadata for every request.
- Use a local deterministic provider for development and offline verification.

## Trade-offs

The MVP does not call an external LLM. This keeps local development deterministic, avoids premature cloud dependencies, and lets the safety and retrieval shape settle first.

The assistant does not store full conversations in a dedicated table. Prompt metadata is written to audit logging. If conversation retention becomes a product requirement, add dedicated AI conversation tables with retention policy, tenant controls, and export/delete handling.

## API

- `POST /api/v1/ai/ask`

The endpoint accepts a user question and optional recent conversation messages. It returns an answer, intent, source records, limitations, suggested prompts, and generation timestamp.

## Security Model

- Read-only by design.
- Bounded retrieval from approved data sets.
- No arbitrary SQL generation.
- No operational writes, approvals, exports, or deletes.
- Audit metadata records prompt length, intent, source count, and limitation count.
- Future provider integrations must apply tenant and permission filtering before context is sent to the model.

## Future Roadmap

- Add Azure OpenAI/OpenAI provider implementation behind the existing provider interface.
- Add permission-aware context retrieval once backend permission guards are implemented.
- Add source-level confidence and structured citations.
- Add record-specific assistant panels on vessel calls, movements, and billing events.
- Add conversation retention with configurable tenant policy.
- Add human-approved draft note generation.
