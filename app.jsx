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
      const idea = await room.collection("ideas").create({
        original_idea: inputIdea,
        super_prompt: superPrompt,
        clicks: 0,
        status: "ready"
      });
      await window.websim.postComment({
        content: `\u{1F4A1} New idea: "${inputIdea}"

\u{1F680} Enhanced prompt: ${superPrompt}

\u2728 Generating project automatically...`
      });
      setTimeout(() => {
        generateProject(idea);
      }, 1e3);
      setInputIdea("");
    } catch (error) {
      console.error("Error generating idea:", error);
    } finally {
      setGenerating(false);
    }
  };
  useEffect(() => {
    const handleCommentCreated = async (data) => {
      const comment = data.comment;
      const content = comment.raw_content;
      if (content.includes("\u{1F4A1} New idea:")) return;
      const ideaText = content.trim();
      if (ideaText.length < 10) return;
      try {
        const superPrompt = await generateSuperPrompt(ideaText);
        const idea = await room.collection("ideas").create({
          original_idea: ideaText,
          super_prompt: superPrompt,
          clicks: 0,
          status: "ready"
        });
        setTimeout(() => {
          generateProject(idea);
        }, 2e3);
      } catch (error) {
        console.error("Error processing comment idea:", error);
      }
    };
    window.websim.addEventListener("comment:created", handleCommentCreated);
    return () => {
      window.websim.removeEventListener("comment:created", handleCommentCreated);
    };
  }, []);
  const generateProject = async (idea) => {
    if (generatingProject) return;
    setGeneratingProject(idea.id);
    setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 1/6</div></div>');
    try {
      await room.collection("ideas").upsert({
        id: idea.id,
        clicks: idea.clicks + 1
      });
      setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 1/6 - HTML Structure</div></div>');
      const htmlCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert web developer. Create a complete, modern HTML structure for this project. Include semantic HTML, proper meta tags, and placeholder content. Make it creative and visually interesting. Only return the HTML code, no markdown formatting or code blocks.`
          },
          {
            role: "user",
            content: idea.super_prompt
          }
        ]
      });
      setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 2/6 - CSS Styling</div></div>');
      const cssCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert CSS designer. Create beautiful, modern CSS styles for this HTML structure. Use gradients, animations, modern layouts, and make it visually stunning. Include responsive design. Only return the CSS code within <style> tags, no markdown formatting.`
          },
          {
            role: "user",
            content: `Super prompt: ${idea.super_prompt}

HTML structure: ${htmlCompletion.content}`
          }
        ]
      });
      setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 3/6 - JavaScript Logic</div></div>');
      const jsCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert JavaScript developer. Add interactive functionality to this project. Create engaging interactions, animations, and features that bring the website to life. Only return the JavaScript code within <script> tags, no markdown formatting.`
          },
          {
            role: "user",
            content: `Super prompt: ${idea.super_prompt}

HTML: ${htmlCompletion.content}

CSS: ${cssCompletion.content}`
          }
        ]
      });
      setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 4/6 - HTML Enhancement</div></div>');
      const htmlRefinedCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Review and enhance this HTML structure. Add more semantic elements, improve accessibility, add meta tags, and make it more engaging. Only return the enhanced HTML code, no markdown formatting.`
          },
          {
            role: "user",
            content: `Original HTML: ${htmlCompletion.content}

Project idea: ${idea.super_prompt}`
          }
        ]
      });
      setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 5/6 - CSS Polish</div></div>');
      const cssPolishedCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Polish and enhance these CSS styles. Add advanced animations, better responsive design, micro-interactions, and modern visual effects. Make it production-ready and visually stunning. Only return the CSS code within <style> tags, no markdown formatting.`
          },
          {
            role: "user",
            content: `Original CSS: ${cssCompletion.content}

Enhanced HTML: ${htmlRefinedCompletion.content}

Project idea: ${idea.super_prompt}`
          }
        ]
      });
      setSandboxContent('<div class="flex items-center justify-center h-full"><div class="animate-pulse text-2xl">\u{1F9E0} AI is thinking... Pass 6/6 - Final Optimization</div></div>');
      const jsFinalCompletion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Optimize and enhance the JavaScript code. Add error handling, performance optimizations, additional interactive features, and smooth animations. Make it production-ready and engaging. Only return the JavaScript code within <script> tags, no markdown formatting.`
          },
          {
            role: "user",
            content: `Original JS: ${jsCompletion.content}

Final HTML: ${htmlRefinedCompletion.content}

Final CSS: ${cssPolishedCompletion.content}

Project idea: ${idea.super_prompt}`
          }
        ]
      });
      const cleanHTML = htmlRefinedCompletion.content.replace(/```html\n?|```\n?/g, "").trim();
      const cleanCSS = cssPolishedCompletion.content.replace(/```css\n?|```\n?/g, "").trim();
      const cleanJS = jsFinalCompletion.content.replace(/```javascript\n?|```js\n?|```\n?/g, "").trim();
      const fullCode = cleanHTML.replace("</head>", `${cleanCSS}
</head>`).replace("</body>", `${cleanJS}
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
        lineNumber: 268,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xl text-gray-300", children: "Turn your ideas into AI-generated websites instantly! \u{1F680}\u2728" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 271,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 267,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid lg:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-purple-400", children: "\u{1F4AD} Share Your Idea" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 281,
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
                lineNumber: 283,
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
                lineNumber: 292,
                columnNumber: 29
              },
              this
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 282,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 280,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-blue-400", children: "\u{1F517} Generated Ideas" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 304,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: ideasLoading ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-8", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "animate-spin text-3xl mb-2", children: "\u{1F300}" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 308,
              columnNumber: 37
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: "Loading ideas..." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 309,
              columnNumber: 37
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 307,
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
                    lineNumber: 321,
                    columnNumber: 53
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "text-sm text-gray-400 line-clamp-2", children: idea.super_prompt }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 324,
                    columnNumber: 53
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 320,
                  columnNumber: 49
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 ml-4", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-gray-700 px-2 py-1 rounded", children: [
                    "\u{1F446} ",
                    idea.clicks
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 329,
                    columnNumber: 53
                  }, this),
                  generatingProject === idea.id ? /* @__PURE__ */ jsxDEV("div", { className: "animate-spin text-xl", children: "\u{1F9E0}" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 333,
                    columnNumber: 57
                  }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-xl opacity-50 group-hover:opacity-100", children: "\u{1F680}" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 335,
                    columnNumber: 57
                  }, this)
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 328,
                  columnNumber: 49
                }, this)
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 319,
                columnNumber: 45
              }, this)
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 314,
              columnNumber: 41
            },
            this
          ) }, idea.id, false, {
            fileName: "<stdin>",
            lineNumber: 313,
            columnNumber: 37
          }, this)) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-8 text-gray-500", children: "No ideas yet! Add one above to get started \u{1F3AF}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 345,
            columnNumber: 33
          }, this) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 305,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 303,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
          /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-green-400", children: "\u{1F3C6} Project Gallery" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 354,
            columnNumber: 25
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: projectsLoading ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-4", children: "Loading projects..." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 357,
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
                    lineNumber: 364,
                    columnNumber: 41
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-500", children: [
                    "by ",
                    project.username
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 365,
                    columnNumber: 41
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 360,
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
                lineNumber: 368,
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
                  lineNumber: 371,
                  columnNumber: 41
                },
                this
              )
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 367,
              columnNumber: 37
            }, this)
          ] }, project.id, true, {
            fileName: "<stdin>",
            lineNumber: 359,
            columnNumber: 33
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 355,
            columnNumber: 25
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 353,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 278,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "bg-gray-800 rounded-xl p-6 border border-gray-700", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-semibold mb-4 text-orange-400", children: "\u{1F5A5}\uFE0F Live Preview" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 386,
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
            lineNumber: 389,
            columnNumber: 29
          },
          this
        ) : /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-center h-full bg-gray-100 text-gray-600", children: /* @__PURE__ */ jsxDEV("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-4xl mb-4", children: "\u{1F3A8}" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 398,
            columnNumber: 37
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-lg", children: "Click an idea to generate a website!" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 399,
            columnNumber: 37
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 397,
          columnNumber: 33
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 396,
          columnNumber: 29
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 387,
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
              lineNumber: 407,
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
              lineNumber: 413,
              columnNumber: 29
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 406,
          columnNumber: 25
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 385,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 276,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 266,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 431,
  columnNumber: 13
}));
