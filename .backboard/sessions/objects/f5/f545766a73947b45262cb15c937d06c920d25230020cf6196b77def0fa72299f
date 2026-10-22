"""Maps newly-solved problems to topic tags (REQ-2.3).

The target vocabulary is the **seeded** `topics` table (plan.md §4.1):
arrays, strings, math, greedy, graphs, trees, dynamic-programming,
data-structures. That is the same set the M5 zone `topic_affinity` maps
and the M3 village UI are built on, so the tagger must speak it.

An earlier version of this file mapped onto `algorithms/optimization/
mathematics/...`, a vocabulary that the seed does not contain. Because
`sync_scheduler._update_village_progress` looks topics up by name and
returns None on a miss, every solve tagged `math`, `graphs` or
`optimization` was silently discarded and no village progress moved. Do
not reintroduce a topic name that is not seeded.
"""
import re
from collections import Counter
from typing import Optional


class TopicTagger:
    """
    Maps Codeforces problem tags to Village topics (REQ-2.3, REQ-3.x).

    Fixed topic list (the seeded set, plan.md §4.1):
    - arrays
    - strings
    - math
    - greedy
    - graphs
    - trees
    - dynamic-programming
    - data-structures
    """

    # Judge tag -> seeded topic. Keys are normalized (lowercase, spaces),
    # so "data-structures" and "data structures" both resolve.
    TAG_TO_TOPIC = {
        # dynamic-programming family
        "dp": "dynamic-programming",
        "dynamic programming": "dynamic-programming",

        # graphs family
        "graphs": "graphs",
        "graph": "graphs",
        "dfs": "graphs",
        "dfs and similar": "graphs",
        "shortest paths": "graphs",
        "flows": "graphs",
        "flow": "graphs",
        "graph theory": "graphs",

        # trees family
        "trees": "trees",
        "tree": "trees",
        "dsu": "trees",
        "binary tree": "trees",
        "segment tree": "trees",

        # data-structures family
        "data structures": "data-structures",
        "data structure": "data-structures",
        "hashing": "data-structures",
        "constructive algorithms": "data-structures",

        # strings family
        "strings": "strings",
        "string suffix structures": "strings",
        "suffix structures": "strings",
        "suffix array": "strings",
        "kmp": "strings",
        "string": "strings",
        "string processing": "strings",
        "palindromes": "strings",

        # math family
        "math": "math",
        "number theory": "math",
        "combinatorics": "math",
        "geometry": "math",
        "probabilities": "math",
        "combinatorics and probabilities": "math",
        "ternary search": "math",
        "divide and conquer": "math",

        # greedy family
        "greedy": "greedy",

        # arrays family
        "implementation": "arrays",
        "sortings": "arrays",
        "two pointers": "arrays",
        "binary search": "arrays",
        "brute force": "arrays",
        "arrays": "arrays",
        "sorting": "arrays",
    }

    FIXED_TOPICS = {
        "arrays",
        "strings",
        "math",
        "greedy",
        "graphs",
        "trees",
        "dynamic-programming",
        "data-structures",
    }

    # plan.md §4.6: unmapped tags are counted rather than silently dropped,
    # so the map can be tuned from real judge traffic.
    UNMAPPED_TAG_COUNTER = Counter()

    @staticmethod
    def _normalize(tag: str) -> str:
        """Lowercase, collapse whitespace, and treat -/_ as a space so that
        "data-structures", "data_structures" and "data structures" match."""
        return re.sub(r"[\s\-_]+", " ", tag.strip().lower()).strip()

    @staticmethod
    def map_tags(codeforces_tags: list[str]) -> set[str]:
        """
        Convert Codeforces problem tags to Village topics.

        Args:
            codeforces_tags: List of tags from Codeforces (e.g. ["dp", "trees"])

        Returns:
            Set of seeded topic names (empty set if nothing mapped).
        """
        topics: set[str] = set()
        for tag in codeforces_tags:
            normalized = TopicTagger._normalize(tag)
            topic = TopicTagger.TAG_TO_TOPIC.get(normalized)
            if topic is not None:
                topics.add(topic)
            else:
                TopicTagger.UNMAPPED_TAG_COUNTER[normalized] += 1
        return topics

    @staticmethod
    def get_topic_by_name(name: str) -> Optional[str]:
        """
        Validate and return a topic name if it is in the seeded set.

        Args:
            name: Topic name to validate

        Returns:
            Topic name if valid, None otherwise
        """
        candidate = name.strip().lower()
        if candidate in TopicTagger.FIXED_TOPICS:
            return candidate
        # Accept a judge tag as a convenience, returning the seeded topic.
        return TopicTagger.TAG_TO_TOPIC.get(TopicTagger._normalize(name))
