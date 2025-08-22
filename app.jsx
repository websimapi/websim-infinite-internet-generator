import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
const room = new WebsimSocket();
function App() {
  const [inputIdea, setInputIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [generatingProject, setGeneratingProject] = useState(null);
  const [sandboxContent, setSandboxContent] = useState("");
  const { data: ideas, loading: ideasLoading } = useQuery(room.collection("ideas"));
  const { data: projects, loading: projectsLoading } = useQuery(room.collection("generated_projects"));
  const generateSuperPrompt = async (idea) => {
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Transform the user's idea into a detailed, creative super prompt for generating a complete website. Make it specific, imaginative, and include details about design, functionality, and user experience. The result should inspire an amazing, unique web application.`
        },
        {
          role: "user",
          content: idea
        }
      ]
    });
    return completion.content;
  };
  const handleAddIdea = async () => {
    if (!inputIdea.trim() || generating) return;
    setGenerating(true);
    try {
      const superPrompt = await generateSuperPrompt(inputIdea);
      await room.collection("ideas").create({
        original_idea: inputIdea,
        super_prompt: superPrompt,
        clicks: 0,
        status: "ready"
      });
      setInputIdea("");
    } catch (error) {
      console.error("Error generating idea:", error);
    } finally {
      setGenerating(false);
    }
  };
  const generateProject = async (idea) => {
    if (generatingProject) return;
    setGeneratingProject(idea.id);
    setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking...</div></div>');
    try {
      await room.collection("ideas").upsert({
        id: idea.id,
        clicks: idea.clicks + 1
      });
      const htmlCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert web developer. Create a complete, modern HTML structure for this project. Include semantic HTML, proper meta tags, and placeholder content. Make it creative and visually interesting. Only return the HTML code, no explanations.`
          },
          {
            role: "user",
            content: idea.super_prompt
          }
        ]
      });
      const cssCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert CSS designer. Create beautiful, modern CSS styles for this HTML structure. Use gradients, animations, modern layouts, and make it visually stunning. Include responsive design. Only return the CSS code within <style> tags.`
          },
          {
            role: "user",
            content: `Super prompt: ${idea.super_prompt}

HTML structure: ${htmlCompletion.content}`
          }
        ]
      });
      const jsCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert JavaScript developer. Add interactive functionality to this project. Create engaging interactions, animations, and features that bring the website to life. Only return the JavaScript code within <script> tags.`
          },
          {
            role: "user",
            content: `Super prompt: ${idea.super_prompt}

HTML: ${htmlCompletion.content}

CSS: ${cssCompletion.content}`
          }
        ]
      });
      const fullCode = htmlCompletion.content.replace("</head>", `${cssCompletion.content}
</head>`).replace("</body>", `${jsCompletion.content}
</body>`);
      const project = await room.collection("generated_projects").create({
        idea_id: idea.id,
        title: idea.original_idea,
        code: fullCode,
        votes: 0,
        views: 0
      });
      setSandboxContent(fullCode);
      setSelectedProject(project);
    } catch (error) {
      console.error("Error generating project:", error);
      setSandboxContent('<div class="flex items-center justify-center h-full text-red-500"><div>\u274C Generation failed</div></div>');
    } finally {
      setGeneratingProject(null);
    }
  };
  const voteProject = async (project) => {
    try {
      await room.collection("project_votes").upsert({
        id: `${(await window.websim.getCurrentUser()).id}-${project.id}`,
        project_id: project.id
      });
      const votes = await room.collection("project_votes").filter({ project_id: project.id }).getList();
      await room.collection("generated_projects").upsert({
        id: project.id,
        votes: votes.length
      });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };
  const viewProject = async (project) => {
    setSelectedProject(project);
    setSandboxContent(project.code);
    await room.collection("generated_projects").upsert({
      id: project.id,
      views: project.views + 1
    });
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4", children: "Infinite Internet Generator" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 165,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xl text-gray-300", children: "Turn your ideas into AI-generated websites instantly! \u{1F680}\u2728" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 168,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 164,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid lg:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-purple-400", children: "\u{1F4AD} Share Your Idea" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 178,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: inputIdea,
                onChange: (e) => setInputIdea(e.target.value),
                placeholder: "A social network for time travelers...",
                className: "flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                onKeyPress: (e) => e.key === "Enter" && handleAddIdea(),
                disabled: generating
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 180,
                columnNumber: 29
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleAddIdea,
                disabled: generating || !inputIdea.trim(),
                className: "px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold",
                children: generating ? "\u{1F9E0}" : "\u2728"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 189,
                columnNumber: 29
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 179,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 177,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-blue-400", children: "\u{1F517} Generated Ideas" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 201,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: ideasLoading ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-8", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "animate-spin text-3xl mb-2", children: "\u{1F300}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 205,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: "Loading ideas..." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 206,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 204,
            columnNumber: 33
          }, this) : ideas?.length ? ideas.map((idea) => /* @__PURE__ */ jsxDEV("div", { className: "group", children: /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => generateProject(idea),
              disabled: generatingProject === idea.id,
              className: "w-full text-left p-4 bg-gray-900 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-600 hover:border-purple-500",
              children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "font-medium text-purple-300 mb-1", children: idea.original_idea }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 218,
                    columnNumber: 53
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "text-sm text-gray-400 line-clamp-2", children: idea.super_prompt }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 221,
                    columnNumber: 53
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 217,
                  columnNumber: 49
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 ml-4", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-gray-700 px-2 py-1 rounded", children: [
                    "\u{1F446} ",
                    idea.clicks
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 226,
                    columnNumber: 53
                  }, this),
                  generatingProject === idea.id ? /* @__PURE__ */ jsxDEV("div", { className: "animate-spin text-xl", children: "\u{1F9E0}" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 230,
                    columnNumber: 57
                  }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-xl opacity-50 group-hover:opacity-100", children: "\u{1F680}" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 232,
                    columnNumber: 57
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 225,
                  columnNumber: 49
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 216,
                columnNumber: 45
              }, this)
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 211,
              columnNumber: 41
            },
            this
          ) }, idea.id, false, {
            fileName: "<stdin>",
            lineNumber: 210,
            columnNumber: 37
          }, this)) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-8 text-gray-500", children: "No ideas yet! Add one above to get started \u{1F3AF}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 242,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 202,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 200,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-green-400", children: "\u{1F3C6} Project Gallery" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 251,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: projectsLoading ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-4", children: "Loading projects..." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 254,
            columnNumber: 33
          }, this) : projects?.sort((a, b) => b.votes - a.votes)?.map((project) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-600", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => viewProject(project),
                className: "flex-1 text-left hover:text-purple-300 transition-colors",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "font-medium", children: project.title }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 261,
                    columnNumber: 41
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-500", children: [
                    "by ",
                    project.username
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 262,
                    columnNumber: 41
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 257,
                columnNumber: 37
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-gray-700 px-2 py-1 rounded", children: [
                "\u{1F441}\uFE0F ",
                project.views
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 265,
                columnNumber: 41
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => voteProject(project),
                  className: "text-sm bg-green-600 hover:bg-green-500 px-3 py-1 rounded transition-colors",
                  children: [
                    "\u2B50 ",
                    project.votes
                  ]
                },
                void 0,
                true,
                {
                  fileName: "<stdin>",
                  lineNumber: 268,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 264,
              columnNumber: 37
            }, this)
          ] }, project.id, true, {
            fileName: "<stdin>",
            lineNumber: 256,
            columnNumber: 33
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 252,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 250,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 175,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-orange-400", children: "\u{1F5A5}\uFE0F Live Preview" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 283,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-white rounded-lg overflow-hidden", style: { height: "600px" }, children: sandboxContent ? /* @__PURE__ */ jsxDEV(
          "iframe",
          {
            srcDoc: sandboxContent,
            className: "w-full h-full border-0",
            sandbox: "allow-scripts allow-same-origin allow-forms",
            title: "Generated Website Preview"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 286,
            columnNumber: 29
          },
          this
        ) : /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-center h-full bg-gray-100 text-gray-600", children: /* @__PURE__ */ jsxDEV("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-4xl mb-4", children: "\u{1F3A8}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 295,
            columnNumber: 37
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-lg", children: "Click an idea to generate a website!" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 296,
            columnNumber: 37
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 294,
          columnNumber: 33
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 293,
          columnNumber: 29
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 284,
          columnNumber: 21
        }, this),
        selectedProject && /* @__PURE__ */ jsxDEV("div", { className: "mt-4 flex gap-3", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => voteProject(selectedProject),
              className: "flex-1 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors",
              children: [
                "\u2B50 Vote (",
                selectedProject.votes,
                ")"
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 304,
              columnNumber: 29
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                navigator.clipboard.writeText(selectedProject.code);
                alert("Code copied to clipboard!");
              },
              className: "px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors",
              children: "\u{1F4CB} Copy Code"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 310,
              columnNumber: 29
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 303,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 282,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 173,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 163,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 328,
  columnNumber: 13
}));
