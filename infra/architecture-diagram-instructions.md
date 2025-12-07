# Architecture Diagram Instructions

## Option 1: Using diagrams.net (draw.io)

1. **Open diagrams.net**: Go to https://app.diagrams.net/
2. **Import File**: 
   - Click "File" → "Open from" → "Device"
   - Select `infra/architecture-diagram.drawio`
   - The diagram will load with all components and connections

3. **Edit if Needed**:
   - Customize colors, labels, or layout
   - Add additional components if needed
   - Adjust positioning for clarity

4. **Export**:
   - Click "File" → "Export as" → "PNG" or "PDF"
   - Save as `architecture-diagram.png` or `.pdf`

## Option 2: Create from Scratch in diagrams.net

If the drawio file doesn't work, follow these steps:

### Step 1: Create New Diagram
- Go to https://app.diagrams.net/
- Click "Create New Diagram"
- Choose "Blank Diagram"

### Step 2: Add Components (Top to Bottom)

**Layer 1: User Interfaces** (5 boxes, horizontal)
- Web (Text)
- Mobile App (Text/Voice)
- WhatsApp (Text)
- RCS (Text)
- Phone (Voice)

**Layer 2: Channel Adapters** (1 box, centered)
- Channel Adapters (Webhook Handlers)

**Layer 3: Orchestrator** (1 box, centered)
- Message Orchestrator (server.js)

**Layer 4: NLU Layer** (1 box, centered)
- NLU Layer (Gemini)
  - Intent Detection
  - Slot Extraction
  - Confidence Scoring

**Layer 5: Decision Point** (1 diamond shape, centered)
- Decision Point (Informational vs Action)

**Layer 6: RAG & Actions** (2 boxes, side by side)
- Left: RAG Retriever (KB Search)
- Right: Action Executor (Mock APIs)

**Layer 7: Response Generator** (1 box, centered)
- Response Generator (Gemini)
  - Context Assembly
  - Natural Language Gen

**Layer 8: Channel Adapter (Response)** (1 box, centered)
- Channel Adapter (Format)
  - Text Response
  - SSML (Voice)
  - Rich Media

**Layer 9: User Response** (1 box, centered)
- User Response

**Side Components:**
- Knowledge Base (kb.json) - Left side, connected to RAG
- User Data (users.json) - Right side, connected to Actions

### Step 3: Add Arrows (Connections)

1. **User Interfaces → Channel Adapters**: 5 arrows (one from each interface)
2. **Channel Adapters → Orchestrator**: 1 arrow
3. **Orchestrator → NLU Layer**: 1 arrow
4. **NLU Layer → Decision Point**: 1 arrow
5. **Decision Point → RAG Retriever**: 1 arrow (labeled "Informational")
6. **Decision Point → Action Executor**: 1 arrow (labeled "Actionable")
7. **RAG Retriever → Response Generator**: 1 arrow
8. **Action Executor → Response Generator**: 1 arrow
9. **Response Generator → Channel Adapter (Response)**: 1 arrow
10. **Channel Adapter (Response) → User Response**: 1 arrow
11. **Knowledge Base → RAG Retriever**: 1 dashed arrow
12. **User Data → Action Executor**: 1 dashed arrow

### Step 4: Color Coding

- **User Interfaces**: Light Blue (#dae8fc)
- **Channel Adapters**: Light Yellow (#fff2cc)
- **Orchestrator**: Light Red (#f8cecc)
- **NLU/Response Generator**: Light Purple (#e1d5e7)
- **Decision Point**: Light Green (#d5e8d4)
- **RAG/Actions**: Light Orange (#ffe6cc)
- **Data Stores**: Light Gray (#f5f5f5)

### Step 5: Labels

- Add labels to arrows where helpful (e.g., "Informational", "Actionable")
- Use dashed lines for data access (KB → RAG, Users → Actions)

## Option 3: Textual Diagram (Already in architecture.md)

The textual diagram in `infra/architecture.md` is sufficient for documentation. The visual diagram is optional but recommended for presentations.

## Quick Reference: Component Descriptions

- **User Interfaces**: Entry points for users (web, mobile, WhatsApp, RCS, phone)
- **Channel Adapters**: Normalize messages from different channels
- **Orchestrator**: Routes messages, coordinates components
- **NLU Layer**: Extracts intent, slots, confidence using Gemini
- **Decision Point**: Routes to informational (RAG) or actionable (APIs) path
- **RAG Retriever**: Searches knowledge base for relevant information
- **Action Executor**: Executes actions (activate card, set autopay, etc.)
- **Response Generator**: Creates natural language responses using Gemini
- **Channel Adapter (Response)**: Formats response for target channel
- **Knowledge Base**: Stores 20 knowledge items
- **User Data**: Stores user accounts, cards, transactions

## Tips

- Keep diagram simple and readable
- Use consistent spacing
- Group related components
- Use arrows to show data flow
- Add labels where helpful
- Export in high resolution for presentations

---

**Note**: The drawio file (`architecture-diagram.drawio`) should work directly in diagrams.net. If it doesn't, use Option 2 to recreate it.

