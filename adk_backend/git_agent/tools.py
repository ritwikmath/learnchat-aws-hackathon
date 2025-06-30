import requests

def read_file_from_github_raw(owner: str, repo: str, branch: str, filepath: str):
    """
    Reads a file directly from a GitHub raw content URL.

    Args:
        owner (str): The GitHub username or organization that owns the repository.
        repo (str): The name of the repository.
        branch (str): The branch name (e.g., 'main', 'master').
        filepath (str): The path to the file within the repository.

    Returns:
        str: The content of the file, or None if an error occurs.
    """
    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filepath}"
    try:
        response = requests.get(raw_url)
        response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error reading file from GitHub: {e}")
        return None