from google.adk.agents import Agent, SequentialAgent, LlmAgent, BaseAgent
from google.adk.models.lite_llm import LiteLlm
from typing_extensions import override
from google.adk.agents.invocation_context import InvocationContext
from typing import AsyncGenerator
from google.adk.events import Event
from .tools import read_file_from_github_raw
import logging


MODEL_GPT_4O = "openai/gpt-4.1"
MODEL_CLAUDE_SONNET = "anthropic/claude-sonnet-4-20250514"

logger = logging.getLogger(__name__)

class UnitTestGeneratorFlowAgent(BaseAgent):
    """
    A sophisticated agent designed to manage the end-to-end flow of generating unit tests
    from either raw Python code or a GitHub file. This agent orchestrates a series of
    sub-agents responsible for input determination, file reading, code refactoring,
    documentation, and unit test generation.
    """

    input_decide_agent: LlmAgent
    file_read_agent: Agent
    code_refactor_agent: LlmAgent
    code_documentation_agent: LlmAgent
    unit_test_agent: LlmAgent
    code_create_agent: LlmAgent
    # code_extract_agent is declared but not used in __init__, consider if it's needed

    sequential_agent: SequentialAgent

    model_config = {"arbitrary_types_allowed": True}

    def __init__(
        self,
        name: str,
        input_decide_agent: LlmAgent,
        file_read_agent: Agent,
        code_create_agent: LlmAgent,
        code_refactor_agent: LlmAgent,
        code_documentation_agent: LlmAgent,
        unit_test_agent: LlmAgent,
    ):
        """
        Initializes the UnitTestGeneratorFlowAgent with its constituent sub-agents.

        This constructor sets up a sequential pipeline for code processing and
        integrates an initial input decision agent and file reading agent to handle
        different input sources (raw code vs. GitHub file).

        Args:
            name (str): The name of this main flow agent.
            input_decide_agent (LlmAgent): An LlmAgent responsible for determining
                                            the type of user input (e.g., raw code, GitHub URL).
            file_read_agent (Agent): An Agent responsible for reading file content,
                                     either directly from input or by fetching from GitHub.
            code_refactor_agent (LlmAgent): An LlmAgent dedicated to refactoring the provided code.
            code_documentation_agent (LlmAgent): An LlmAgent for adding comprehensive
                                                  documentation (docstrings, comments) to the code.
            unit_test_agent (LlmAgent): An LlmAgent for generating unit tests for the code.
        """
        # Create the core code processing pipeline (refactoring, documentation, unit tests)
        sequential_agent = SequentialAgent(
            name="CodePipelineAgent",
            sub_agents=[code_refactor_agent, code_documentation_agent, unit_test_agent],
            description="Executes a sequence of code refactoring, documentation, and unit test generation.",
        )

        # Define the overall sequence of agents for this flow agent
        # The flow will be: input_decide -> file_read -> (refactor -> document -> unit_test)
        sub_agents_list = [
            input_decide_agent,
            file_read_agent,
            code_create_agent,
            sequential_agent # The sequential_agent encapsulates the rest of the pipeline
        ]
        
        # Initialize the BaseAgent parent class with all agents and the flow's name
        super().__init__(
            name=name,
            # Pass the individual agents and the sequential_agent as attributes
            input_decide_agent=input_decide_agent,
            file_read_agent=file_read_agent,
            code_create_agent=code_create_agent,
            code_refactor_agent=code_refactor_agent,
            code_documentation_agent=code_documentation_agent,
            unit_test_agent=unit_test_agent,
            sequential_agent=sequential_agent,
            # Crucially, set the `sub_agents` for the BaseAgent if it's meant to be a Sequential-like agent itself
            # If BaseAgent does not directly accept `sub_agents` in its __init__,
            # you might need to assign it later or ensure BaseAgent is designed for this.
            sub_agents=sub_agents_list 
        )
    
    @override
    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        """
        Implements the custom orchestration logic for the story workflow.
        Uses the instance attributes assigned by Pydantic (e.g., self.unit_test_agent).
        """
        user_query = ctx.user_content.parts[0].text
        
        if "history" not in ctx.session.state:
            ctx.session.state["history"] = []

        ctx.session.state["history"].append({
            "owner": "user",
            "text": user_query
        })
        
        async for event in self.input_decide_agent.run_async(ctx):
            yield event
        
        if "input_type" not in ctx.session.state or not ctx.session.state["input_type"]:
             return # Stop processing if initial story failed
        
        if (user_input_type := ctx.session.state["input_type"].replace('\n', '')) not in ["github_details", "python_code", "code_modification", "code_generation"]:
            ctx.session.state["history"].append({
                "owner": "system",
                "text": user_input_type
            })
            yield Event(
                content={"parts": [{"text": user_input_type}]},
                author=self.name,
                actions={"stateDelta": {
                    "final_output": user_input_type,
                    "history": ctx.session.state["history"]
                }}
            )
            return
        
        if user_input_type in ["github_details", "python_code"]:
            async for event in self.file_read_agent.run_async(ctx):
                yield event
        elif user_input_type == "code_generation":
            async for event in self.code_create_agent.run_async(ctx):
                yield event
        elif user_input_type == "code_modification" and not ctx.session.state.get("final_code", False):
            error_response = "I don't have a code to fullfill your request. Please provide the code or github access details."
            ctx.session.state["history"].append({
                "owner": "system",
                "text": error_response
            })
            yield Event(
                content={"parts": [{"text": user_input_type}]},
                author=self.name,
                actions={"stateDelta": {
                    "final_output": error_response,
                    "history": ctx.session.state["history"]
                }}
            )
            return

        async for event in self.sequential_agent.run_async(ctx):
            yield event

        final_response = ctx.session.state.get("final_code", "No valid response")
        ctx.session.state["history"].append({
            "owner": "system",
            "text": final_response
        })
        yield Event(
            content={"parts": [{"text": user_input_type}]},
            author=self.name,
            actions={"stateDelta":{
                "final_output": final_response,
                "history": ctx.session.state["history"]
            }}
        )

    
input_decide_agent = LlmAgent(
    name="unit_test_generate_agent",
    model="gemini-2.0-flash",
    description="This agent decides the type of message.",
    instruction="""Analyze the user's input.
    
    **Task**
    Decide the content type of user input. The input can be categorized in three types.

    1. github_details if the user input contains details to fetch a file from github. It can be in any form but messagge should have owner, repo, branch and filepath details. Or it can be github url, eg. https://github.com/ritwikmath/datastructure-practice/blob/main/algorithms/selectionsort.go where  ritwikmath is owner, datastructure-practice is repo, main is branch, algorithms/selectionsort.py is the file path
    2. python_code if the user input contains raw python code. It can have other related information but raw python code that can be used to generate unit test cases is must. 
    3. code_modification if the user input requests to make some changes to the pre-generated code
    4. code_generation instructions. The user input contain information on generating code.
    5. invalid_information if the user input does not provide python code for which unit test cases need to be generatted or github file location details from where file can be fetched.

    **Output**
    In case of github_details, code_modification, code_generation and python_code, output should contain only either of these two exact words. In case of invalid_information return a error message stating input should be either python code or github file location details.
    Example of error response in case of invalid_information: 
    ```text Sorry, I couldn't understand your request. To proceed, please provide either:
    1.  **Raw Python code:** Enclosed in triple backticks if possible (e.g., ```python def my_func(): pass ```).
    2.  **GitHub file details:** Including the repository owner, name, branch, and file path (e.g., 'octocat/Spoon-Knife/main/README.md'). ```
    3.  **Git URL:** Url to the file (e.g., 'https://github.com/ritwikmath/datastructure-practice/blob/main/algorithms/selectionsort.py'). ```
    4.  **Instructions to generate code:** Write down instructions to generate a code in Python 
    """,
    output_key="input_type"
)

file_read_agent = Agent(
    name="read_git_file_or_code_agent", # Renamed for clarity
    model="gemini-2.0-flash",
    description=(
        "This agent intelligently processes user input. It first determines if the input "
        "is raw Python code. If so, it directly returns the code. Otherwise, it assumes "
        "the input consists of GitHub file location details (owner/repo/branch/filepath) "
        "and attempts to read the content of that specified file from a public GitHub repository. "
        "It is designed to provide the raw content of Python code or a GitHub file."
    ),
    instruction="""Your primary task is to identify the nature of the user's input.

1.  **If the input appears to be raw Python code:**
    * Look for common Python syntax (e.g., `def`, `import`, `class`, `print(`, indentation patterns, triple backticks indicating code blocks).
    * If it is Python code, your output should be the *exact* provided Python code. Do NOT attempt to use any tools or interpret it as GitHub details. Your output_key ("file_content") should simply contain this raw code.

2.  **If the input does NOT appear to be raw Python code:**
    * Assume the input represents GitHub file location details.
    * Extract the `owner`, `repo`, `branch`, and `filepath` from the user's input.
    * **Crucially, use the `read_file_from_github_raw` tool** with these extracted details to fetch the file's content.
    * If the file is successfully read, return its content as the output.
    * If the input format is invalid for GitHub details or the file cannot be read, your output should be a clear error message indicating that the GitHub details were malformed or the file could not be accessed.

**Output Format:**
* **For Python Code Input:** The raw Python code as a string.
* **For GitHub File Content:** The raw content of the file from GitHub as a string.
* **For Invalid GitHub Details/Error:** A clear error message (e.g., "Error: Invalid GitHub file details provided. Please use owner/repo/branch/filepath format, or provide valid Python code.")
""",
    tools=[read_file_from_github_raw], # Your GitHub reading tool
    output_key="file_content"
)

code_create_agent = LlmAgent(
    name="code_create_agent",
    model=LiteLlm(model=MODEL_CLAUDE_SONNET),
    description="Read user instructions and create a code. The code should be generated in Python.",
    instruction="""You are a code generating agent.
Your goal is to understand the user instructions and create a Python code.
  **Task:**
  Carefully analyse user request and generate a code in Python. The code should be syntactically right and cover all logical components requested by user. 
  Even if user mentions different Programming Language, use Python only. 

  **Output:**
  Output the entire code base enclosed in triple backticks (```python ... ```). 
Do not add any other text before or after the code block.
    """,
    output_key="file_content"
)

code_refactor_agent = LlmAgent(
    name="code_refactoring_agent",
    model=LiteLlm(model=MODEL_CLAUDE_SONNET),
    description="Read the code and find out potential syntax issue, weak logic or possibility of make the code effecient.",
    instruction="""You are a code refactoring mechanism.
Your goal is to study the code and identofy areas of imporevement.
 **Original Code:**
  ```python
  {file_content}
  ``` 
  **Task:**
  Carefully rafactor the code to make sure it is syntactically correct. Find possible areas of improvement. Do not add additional unncessary logic to the code.
  If the original code failed to cover all possible scenarios update the code to catch the potential issue.

  **Output:**
  Replace the original content with the original code. Then output the entire code base enclosed in triple backticks (```python ... ```). 
Do not add any other text before or after the code block.

    """,
    output_key="refactored_code"
)

code_documentation_agent = LlmAgent(
    name="code_documenting_agent",
    model=LiteLlm(model=MODEL_GPT_4O),
    description="Read the code and add proper documentation to the code. The documentation should be able to explain logically comlex areas easily. Add docstring to wherever appropriate.",
    instruction="""You are a code documentation agent.
Your goal is to study the code and identofy where docstring and comments can be added to explain the code.
 **Refactored Code:**
  ```python
  {refactored_code}
  ``` 
  **Task:**
  Carefully document the code so it can be understood by anyone. This documentation will be used by another LLM agent so the documentation should be easy to understand and elaborative.
  For docstring use proper and standard format.

  **Output:**
  Replace the original content with the refactored code. Then output the entire code base enclosed in triple backticks (```python ... ```). 
Do not add any other text before or after the code block.

    """,
    output_key="documented_code"
)

unit_test_agent = LlmAgent(
    name="unit_test_generate_agent",
    model="gemini-2.0-flash",
    description="Creates unit test based on code written in file",
    instruction="""You are a unit test code generator.
Your goal is to generate unit test cases for the Python code.
 **Documented Code:**
  ```python
  {documented_code}
  ``` 
  **Task:**
  Carefully generate unit test cases that are approprite, logically and syntactically correct. Cover most of the scenarios, if code base is small and simple then cover all.

  **Output:**
  Merge the unit test cases along with the documented code. Then output the entire code base enclosed in triple backticks (```python ... ```). 
Do not add any other text before or after the code block.
    """,
    output_key="final_code"
)

unit_test_generator_flow_agent = UnitTestGeneratorFlowAgent(
    name="UnitTestGeneratorFlowAgent",
    input_decide_agent=input_decide_agent,
    file_read_agent=file_read_agent,
    code_create_agent=code_create_agent,
    code_refactor_agent=code_refactor_agent,
    code_documentation_agent=code_documentation_agent,
    unit_test_agent=unit_test_agent,
)

root_agent = unit_test_generator_flow_agent