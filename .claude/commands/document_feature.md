# Document Feature Command

Please, Carefully generate a technical documentation for the developer and a helpful and thorough user friendly guide for the  feature $ARGUMENTS.

## Process

1. Understand the project work-flow by reading the necessary files including code files for the feature $ARGUMENTS. 
2. Understand the technical details that is needed for a developer to understand, add and modify the feature.
3. Create a documentation for the developer which involves technical specs, API details, implementation notes etc. with the necessary project   architecture and work-flow.
4. Create a user-friendly guide for the end-user with step-by-step screenshots as the control flows from start to end as the user interacts with the app. Also explain what happen when user fails to enter the appropriate values with the screenshots and warning messages as other use-cases.

## Stack detection
Based on the files found:
- If only UI files (components, pages, hooks) → label as "Frontend" and skip API/DB sections
- If only server files (routes, controllers, models) → label as "Backend" and skip component sections  
- If both → label as "Full-Stack" and include all sections

## Output Requirements

1. Name the technical documentation for developers as $ARGUMENTS-implementation.md . Store it inside the directory docs/dev/. 
2. Name the user-friendly guide as how-to-$ARGUMENTS.md .Store it in the directory docs/user/
3. Create the necessary directory structure if not already there to store the above two files.
4. There should proper cross-refernce between the two above two documents for the user to refer to if needed.
5. If there are already other user-friedly guides which are helpful for the user then provide a auto-link to jump to the relevant document(s).
6. Similarly, if there are already other technical doc which are helpful for the developer then provide a auto-link to jump to the relevant document(s).

## After writing both files, print:
- Paths to both files created
- Stack layer detected
- Number of source files analysed
- Number of screenshot placeholders added

## After generating:
Suggest the user run:
  git add docs/dev/$ARGUMENTS-implementation.md docs/user/how-to-$ARGUMENTS.md
  git commit -m "docs: add documentation for $ARGUMENTS"

## Add a Changelog table 
| Date | Author | Change |
|------|--------|--------|
| {today} | — | Initial documentation |

