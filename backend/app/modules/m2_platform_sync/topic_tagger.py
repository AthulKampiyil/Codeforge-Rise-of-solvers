"""Maps newly-solved problems to topic tags (REQ-2.3)."""
from typing import Optional


class TopicTagger:
    """
    Maps Codeforces problem tags to Village topics (REQ-2.3, REQ-3.x).

    Fixed topic list (per REQ-2.3):
    - algorithms
    - data-structures
    - mathematics
    - strings
    - optimization
    - greedy
    - dynamic-programming
    """

    # Mapping from Codeforces tags to our fixed topic set
    TAG_TO_TOPIC = {
        # algorithms family
        "bfs": "algorithms",
        "dfs": "algorithms",
        "two-pointers": "algorithms",
        "binary-search": "algorithms",
        "brute-force": "algorithms",
        "backtracking": "algorithms",

        # data-structures family
        "data-structures": "data-structures",
        "array": "data-structures",
        "set": "data-structures",
        "hash-table": "data-structures",
        "segment-tree": "data-structures",
        "fenwick-tree": "data-structures",
        "disjoint-set": "data-structures",
        "queue": "data-structures",
        "stack": "data-structures",
        "heap": "data-structures",
        "trie": "data-structures",

        # mathematics family
        "math": "mathematics",
        "number-theory": "mathematics",
        "combinatorics": "mathematics",
        "geometry": "mathematics",

        # strings family
        "strings": "strings",
        "pattern-matching": "strings",
        "suffix-array": "strings",
        "kmp": "strings",

        # optimization family
        "optimization": "optimization",
        "greedy": "greedy",

        # dynamic-programming family
        "dp": "dynamic-programming",
        "dynamic-programming": "dynamic-programming",

        # graph-related (map to algorithms or data-structures)
        "graphs": "algorithms",
        "graph": "algorithms",
        "tree": "data-structures",
        "trees": "data-structures",
    }

    FIXED_TOPICS = {
        "algorithms",
        "data-structures",
        "mathematics",
        "strings",
        "optimization",
        "greedy",
        "dynamic-programming",
    }

    @staticmethod
    def map_tags(codeforces_tags: list[str]) -> set[str]:
        """
        Convert Codeforces problem tags to Village topics.

        Args:
            codeforces_tags: List of tags from Codeforces (e.g., ["dp", "trees"])

        Returns:
            Set of topic names in the fixed list (empty set if no mapping found)
        """
        topics = set()
        for tag in codeforces_tags:
            normalized = tag.lower().strip()
            if normalized in TopicTagger.TAG_TO_TOPIC:
                topics.add(TopicTagger.TAG_TO_TOPIC[normalized])

        return topics

    @staticmethod
    def get_topic_by_name(name: str) -> Optional[str]:
        """
        Validate and return a topic name if it's in the fixed list.

        Args:
            name: Topic name to validate

        Returns:
            Topic name if valid, None otherwise
        """
        normalized = name.lower().strip()
        if normalized in TopicTagger.FIXED_TOPICS:
            return normalized
        return None

