# AI Engineer Roadmap for Full-Stack Developers
### Your 20% Skill-Gap Transition Guide (Self-Taught & Free Resources)

As a Full-Stack Developer with 5 years of experience, you already possess **80% of the required skills** to excel as an AI Engineer. You understand system integration, state management, databases, security, and deployment. The remaining 20% involves shifting from deterministic programming to probabilistic AI architectures. This roadmap outlines exactly what you need to learn, where to find it for free, and what portfolio projects to build.

---

## 🧭 1. The Core 20% Knowledge Stack

*   **LLM Primitives & Mechanics**: Learn tokens, context windows, temperature, top-p, system instructions, and how stochastic (probabilistic) outputs differ from classic deterministic code patterns.
*   **Embeddings & Vector Spaces**: Understand how text strings are mathematically mapped to high-dimensional vectors representing semantic, contextual meaning.
*   **Retrieval-Augmented Generation (RAG)**: Master the architecture of querying external documents, extracting relevant semantic chunks, and feeding them into an LLM context window to prevent model hallucinations.
*   **Orchestration, Tools & Agents**: Transition from static text prompts to dynamic tool-calling. This allows the LLM to autonomously trigger backend database queries and APIs based on user chat intent.

---

## 📚 2. Free Trusted Resource Hub

| Resource / Platform | What You Will Learn | Where to Find It |
| :--- | :--- | :--- |
| **DeepLearning.AI** *(Short Courses)* | Code-first, 1-hour courses on Prompt Engineering for Developers, RAG frameworks, and Large Language Models, built directly with OpenAI and LangChain. | [deeplearning.ai/short-courses](https://deeplearning.ai) |
| **Andrej Karpathy** *(YouTube Channel)* | Watch *"Intro to Large Language Models"* for an industry-standard conceptual foundation. Watch the *"Neural Networks: Zero to Hero"* series if you want to understand the deep math. | [YouTube @AndrejKarpathy](https://youtube.com) |
| **OpenAI Cookbook** *(Official Guides)* | Production-grade code recipes for JSON schema structured outputs, embedding generation, vector searches, and token optimization management. | [://openai.com](https://://openai.com/) |
| **Vercel AI SDK Docs** *(Official Framework)* | The ultimate UI framework guide for streaming response tokens smoothly to web frontends, handling multi-agent workflows, and managing conversational state. | [sdk.vercel.ai/docs](https://vercel.ai) |

---

## 🛠️ 3. Self-Paced Portfolio Projects (The Build Syllabus)

### Project 1: Strict Schema Data Extractor
*   **The Goal**: Send messy text (raw medical logs or customer receipts) to an LLM and force it to yield a perfectly clean JSON output validated by a TypeScript schema.
*   **Skills Learned**: Structured output constraints, schema validation, exception routing.

### Project 2: Multi-Document RAG Application
*   **The Goal**: Build a local backend using Ollama (running Llama 3 or Mistral), split an uploaded PDF manual into 500-token chunks, vector-index them in ChromaDB or Pinecone, and chat with the documentation.
*   **Skills Learned**: Text chunking strategy, vector databases, prompt context injection.

### Project 3: The Autonomous Database Agent
*   **The Goal**: Connect an LLM chat input safely to an SQL or NoSQL database. Allow the LLM to inspect user intent, pick custom tool functions you built, run queries safely, and return plain-English charts.
*   **Skills Learned**: Function calling, sandboxed tool orchestration, stochastic safety design.
