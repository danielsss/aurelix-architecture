window.CONTROL_GUIDE = {
  "revision": "0b6cd0d4e5ddf15b03351a020c969bb11776c863",
  "date": "2026-11-25",
  "operations": [
    {
      "id": "add-node",
      "group": "服务器接入",
      "title": "新增服务器节点",
      "where": "节点 → 添加节点",
      "answer": "不会直接同步到 Xray。添加节点先保存服务器与 SSH 信息，并自动启动环境验证；安装 Agent / Xray 需要你随后手动发起部署。",
      "impact": "登记与验证不写 Xray 配置",
      "steps": [
        {
          "title": "核验服务器身份",
          "actor": "Web → Control → SSH",
          "action": "填写地址和 SSH 登录信息，先检查主机指纹，再明确接受该指纹。使用已有密钥时，服务器仍须允许该密钥登录。",
          "state": "此时只是预检，尚未创建节点。",
          "evidence": "对照可信来源核验指纹；不能把“能连接”当作身份已可信。"
        },
        {
          "title": "保存节点记录",
          "actor": "Control → MongoDB",
          "action": "重新核对 SSH 可连接性后创建节点，保存加密后的 SSH 凭证、可信指纹和默认期望配置。",
          "state": "初始 desiredRevision 为 0，尚无 Agent token 或状态快照。",
          "evidence": "POST /nodes 返回 201；列表出现新节点。"
        },
        {
          "title": "自动检查环境",
          "actor": "Web → Control → SSH",
          "action": "创建成功后界面启动流式验证，展示主机资源、Docker、端口和已有部署等检查结果。",
          "state": "验证结果单独保存；失败不等于节点记录未创建。",
          "evidence": "查看每项检查及最终结果；不能用“列表里有节点”代替通过验证。"
        },
        {
          "title": "继续手动部署",
          "actor": "管理员",
          "action": "验证通过后打开部署操作，确认部署计划。部署成功后，仍需把节点纳入节点池和会员授权链路，用户才能获得入口。",
          "state": "部署、配置生效、业务授权是后续独立状态。",
          "evidence": "继续查看“首次部署 Agent 与 Xray”。"
        }
      ],
      "success": "节点记录已创建，验证结果可见。此时不应要求它已经在线，也不应认为用户已经可以连接。",
      "trap": "Xray 没有一张需要接收“全局服务器列表”的表。每台服务器上的 Xray 接收的是该节点自己的协议、入站和用户配置。",
      "failure": "指纹或 SSH 错误先修正登录信息；验证不通过时先查看具体检查项，不要重复创建同一台服务器。",
      "sources": [
        {
          "path": "apps/web/src/features/nodes/AddNodeDialog.vue",
          "line": 71
        },
        {
          "path": "apps/control/src/modules/nodes/handlers.ts",
          "line": 54
        },
        {
          "path": "apps/control/src/modules/nodes/store.ts",
          "line": 78
        }
      ],
      "api": "POST /api/nodes/preflight → POST /api/nodes → POST /api/nodes/:id/verification",
      "next": "deploy"
    },
    {
      "id": "docker",
      "group": "服务器接入",
      "title": "检查或安装 Docker",
      "where": "节点详情 → Docker",
      "answer": "检查 Docker 与安装 Docker 是两个动作。安装必须明确确认，通过 SSH 在目标服务器执行；添加节点不会自动安装 Docker。",
      "impact": "检查不影响 Xray；安装改变宿主机环境",
      "steps": [
        {
          "title": "读取当前环境",
          "actor": "Control → SSH",
          "action": "核对节点凭证和可信指纹，读取 Docker / Compose 环境。",
          "state": "只返回检查结果。",
          "evidence": "查看实际版本、可用性及错误输出。"
        },
        {
          "title": "确认安装",
          "actor": "管理员 → Control",
          "action": "仅在确认后提交安装；服务端要求 confirmed=true，并拒绝与其他部署任务并行。",
          "state": "创建独立的后台安装任务，返回 202。",
          "evidence": "出现任务进度不代表安装已结束。"
        },
        {
          "title": "完成后重新验证",
          "actor": "Control → SSH",
          "action": "执行安装并记录过程；重新检查环境，再继续首次部署。",
          "state": "Docker 就绪仍不代表 Agent / Xray 已安装。",
          "evidence": "Docker 检查通过，并查看节点环境验证结果。"
        }
      ],
      "success": "Docker / Compose 可用，环境验证满足部署条件。",
      "trap": "安装 Docker 不是部署 Aurelix；不能据此判断 Xray 已健康。",
      "failure": "查看安装任务的具体失败命令与输出；检查资源、系统兼容性和 SSH 权限。",
      "sources": [
        {
          "path": "apps/control/src/modules/provisioning/handlers.ts",
          "line": 25
        }
      ],
      "api": "节点 Docker 检查 / 安装接口；安装请求需要 confirmed=true",
      "next": "deploy"
    },
    {
      "id": "deploy",
      "group": "服务器接入",
      "title": "首次部署 Agent 与 Xray",
      "where": "节点详情 → 部署",
      "answer": "这是把登记记录变成运行节点的步骤。Control 经 SSH 安装独立的 Agent、Xray 容器，再等待 Agent 上报目标配置已生效且 Xray 健康。",
      "impact": "会安装并启动节点服务",
      "steps": [
        {
          "title": "检查部署条件",
          "actor": "Control",
          "action": "要求可信 SSH、环境验证通过、无正在进行的部署；部署前会再次检查实际环境。",
          "state": "创建后台部署任务；HTTP 202 仅表示受理。",
          "evidence": "计划中的服务器、镜像、目录和端口符合预期。"
        },
        {
          "title": "准备配置并安装",
          "actor": "Control → SSH",
          "action": "没有现有入站时初始化协议配置，准备节点身份，执行生成的安装脚本。已有自定义入站不会被初始化逻辑替换。",
          "state": "节点配置 revision 可能前进；远程部署文件和容器被创建。",
          "evidence": "逐项查看写入、拉取、启动日志，不只看请求返回。"
        },
        {
          "title": "Agent 连接并应用",
          "actor": "Agent ↔ Control → Xray",
          "action": "Agent 使用独立节点凭证连接 Control，报告能力与状态；配置协调器向已确认且已报告的连接下发完整期望配置。",
          "state": "Agent 本地验证、应用并记录 appliedRevision。",
          "evidence": "配置事件完成并且 Xray 健康。"
        },
        {
          "title": "等待部署验收",
          "actor": "Control",
          "action": "最多约 120 秒等待健康阶段开始后的新报告，要求 Xray healthy 且 appliedRevision 等于 desiredRevision。",
          "state": "任务完成与节点在线分别可观察。",
          "evidence": "部署任务完成；最新报告匹配目标版本，不能使用旧健康快照。"
        }
      ],
      "success": "部署任务完成，Agent 有新报告，Xray 健康且期望 / 生效 revision 一致。业务用户授权还要继续配置。",
      "trap": "部署成功不自动等于用户订阅已包含节点；业务授权和客户端配置交付是另一条链路。",
      "failure": "按任务阶段定位 SSH、资源、镜像、容器启动或健康检查错误；超时后先读取当前状态，再决定重试。",
      "sources": [
        {
          "path": "apps/control/src/modules/provisioning/handlers.ts",
          "line": 118
        },
        {
          "path": "apps/control/src/modules/provisioning/deployment.ts",
          "line": 44
        },
        {
          "path": "apps/control/src/modules/protocols/configuration.ts",
          "line": 189
        }
      ],
      "api": "POST /api/nodes/:id/deployment（后台任务）",
      "next": "membership"
    },
    {
      "id": "update-agent",
      "group": "服务器接入",
      "title": "升级 Agent",
      "where": "节点详情 → Agent 更新",
      "answer": "更新流程针对 Agent 容器，检查现有资源归属并固定目标镜像 digest；它有别于重做整台节点的首次部署。",
      "impact": "替换 Agent；更新命令不重建 Xray 服务",
      "steps": [
        {
          "title": "读取更新计划",
          "actor": "管理员 → Control",
          "action": "选择目标 Agent 镜像；确认 SSH 与现有部署归属，避免更新其他服务。",
          "state": "生成独立更新计划与任务。",
          "evidence": "目标镜像、当前节点及部署目录正确。"
        },
        {
          "title": "检查兼容并切换",
          "actor": "Control → SSH",
          "action": "核对容器与卷标签，保留现有配置和节点凭证，检查目标 Agent 内置 Xray 与运行版本兼容，再仅重建 Agent。",
          "state": "Agent 镜像与部署标识改变。",
          "evidence": "更新日志显示兼容检查和 Agent 启动成功。"
        },
        {
          "title": "等待新实例报告",
          "actor": "Agent → Control",
          "action": "等待本次 deploymentId 对应的新 Agent 报告，要求 Xray 健康且 revision 匹配。",
          "state": "旧实例的健康报告不能证明升级完成。",
          "evidence": "任务完成，Agent 版本和本次部署标识符合目标。"
        }
      ],
      "success": "本次 Agent 更新任务完成，新实例上报符合目标，Xray 健康。",
      "trap": "发布 Agent 镜像不等于节点已升级；更新过程 Agent 会短暂断连，代理实际连续性仍需单独观测。",
      "failure": "归属或版本不匹配时按日志处理，不能强行覆盖其他 Compose 项目。",
      "sources": [
        {
          "path": "apps/control/src/modules/provisioning/agent-update.ts",
          "line": 8
        },
        {
          "path": "apps/control/src/modules/provisioning/deployment.ts",
          "line": 162
        }
      ],
      "api": "读取更新计划 → 提交 Agent 更新任务",
      "next": "status"
    },
    {
      "id": "ssh",
      "group": "服务器接入",
      "title": "SSH 凭证与密钥",
      "where": "SSH 密钥 / 节点详情 → SSH 信息",
      "answer": "SSH 用于主机检查、安装和维护。它与 Agent 节点 token、网站登录、订阅 token 和代理连接凭证分别管理。",
      "impact": "保存登录信息不修改 Xray",
      "steps": [
        {
          "title": "准备登录材料",
          "actor": "管理员",
          "action": "在 SSH 密钥页面生成 Ed25519 密钥对，并在添加节点时选择；也可直接提供节点登录信息。生成密钥不会自动把公钥装到服务器。",
          "state": "Control 加密保存生成的私钥，展示公钥和指纹。",
          "evidence": "目标服务器允许指定用户和密钥登录。"
        },
        {
          "title": "校验并更新节点",
          "actor": "Control → SSH",
          "action": "更新节点凭证前核对可信指纹并验证连接；随后保存节点自己的加密凭证。",
          "state": "节点环境验证被重置，需要重新验证。",
          "evidence": "保存成功后，重新运行环境验证。"
        },
        {
          "title": "按需继续维护",
          "actor": "管理员",
          "action": "只有你发起部署、更新或维护时，Control 才使用这些凭证执行对应任务。",
          "state": "不会因此轮换 Agent token 或代理用户。",
          "evidence": "SSH 登录可用与 Agent 在线分别检查。"
        }
      ],
      "success": "节点凭证保存且环境验证通过。",
      "trap": "网站密码、SSH 密码、Agent token、代理连接码用途不同，不能相互替代。",
      "failure": "按地址、端口、用户名、密钥和指纹逐项排查；不要用“Agent 在线”推断 SSH 必定可用。",
      "sources": [
        {
          "path": "apps/control/src/modules/ssh-keys/handlers.ts",
          "line": 7
        },
        {
          "path": "apps/control/src/modules/nodes/handlers.ts",
          "line": 87
        },
        {
          "path": "apps/control/src/modules/ssh-keys/store.ts",
          "line": 27
        }
      ],
      "api": "SSH 密钥保存；节点 SSH 信息更新",
      "next": "deploy"
    },
    {
      "id": "protocol",
      "group": "配置与 Xray",
      "title": "修改协议 / 重新同步",
      "where": "节点详情 → 协议配置",
      "answer": "保存协议会产生新的期望配置 revision，再由 Agent 应用。重新同步也会创建新 revision，用于重新执行目标配置。",
      "impact": "改变协议入站；可能短暂中断对应入口",
      "steps": [
        {
          "title": "读取并编辑当前版本",
          "actor": "管理员 → Control",
          "action": "读取期望配置，编辑协议、端口或安全参数；提交 expectedRevision，服务端检查节点能力和任务冲突。",
          "state": "版本不一致时拒绝覆盖。",
          "evidence": "确认正在修改的节点、协议与端口。"
        },
        {
          "title": "保存完整期望配置",
          "actor": "Control → MongoDB",
          "action": "协议编辑转换为完整受管配置；保存新 revision 和 operation，返回 pending。",
          "state": "desiredRevision 前进；Xray 此时可能仍是旧版本。",
          "evidence": "保存成功后继续看生效状态，而非停在 202。"
        },
        {
          "title": "Agent 验证并应用",
          "actor": "Control → Agent → Xray",
          "action": "下发完整配置。Agent 先使用 Xray -test 验证；可针对变更入站调用私有 API，必要时重启；新增容器未映射端口可能先重建 Xray 容器。",
          "state": "成功后才推进 appliedRevision；失败尝试恢复旧配置。",
          "evidence": "目标 revision 已应用且 healthy=true。"
        }
      ],
      "success": "目标 revision 与 appliedRevision 一致，Xray 健康；真实客户端还需验证端口、防火墙和网络连通性。",
      "trap": "入站更新不是全程无中断保证；移除再加入对应入站及端口映射变化都可能影响连接。",
      "failure": "检查 CONFIG_CONFLICT、能力不足、配置验证、端口发布、执行与回滚错误；超时表示结果未知，先刷新状态。",
      "sources": [
        {
          "path": "apps/control/src/modules/protocols/handlers.ts",
          "line": 17
        },
        {
          "path": "apps/control/src/modules/agents/configuration.ts",
          "line": 18
        },
        {
          "path": "apps/node-agent/src/reconcile/configuration.ts",
          "line": 162
        }
      ],
      "api": "PUT /api/nodes/:id/protocols；control:configuration:apply",
      "next": "revision"
    },
    {
      "id": "config-json",
      "group": "配置与 Xray",
      "title": "完整 JSON 配置",
      "where": "节点详情 → 配置",
      "answer": "完整配置保存同样走“期望版本 → Agent 验证 → 应用 → 健康确认”，不会因为 JSON 已保存就立即宣告 Xray 成功。",
      "impact": "可能更新用户、入站或重启 Xray",
      "steps": [
        {
          "title": "校验并保存",
          "actor": "Control",
          "action": "解析受管 JSON，并以 expectedRevision 防止旧页面覆盖新配置。",
          "state": "数据库保存新的完整目标配置。",
          "evidence": "语法与受管结构有效，版本未冲突。"
        },
        {
          "title": "选择执行方式",
          "actor": "Agent",
          "action": "用官方 Xray 二进制验证候选文件，再根据实际差异选择用户 API、入站 API 或重启执行。",
          "state": "本地先记录应用中状态，成功后持久保存目标版本。",
          "evidence": "查看 applied / attempted 及错误码。"
        },
        {
          "title": "失败时核对恢复",
          "actor": "Agent → Control",
          "action": "应用失败尝试恢复旧文件与运行配置；恢复失败保留明确错误，不能把回滚成功算作目标配置成功。",
          "state": "实际运行版本可能停留在旧版本。",
          "evidence": "Xray 健康与生效 revision 一并检查。"
        }
      ],
      "success": "目标 revision 已应用且 Xray 健康。",
      "trap": "HTTP 保存成功、配置语法通过和代理真实可用是三个不同检查。",
      "failure": "检查验证输出、应用错误及回滚结果；不要只反复保存同一份 JSON。",
      "sources": [
        {
          "path": "apps/control/src/modules/nodes/configuration.ts",
          "line": 4
        },
        {
          "path": "apps/node-agent/src/reconcile/configuration.ts",
          "line": 162
        }
      ],
      "api": "PUT /api/nodes/:id/configuration",
      "next": "revision"
    },
    {
      "id": "xray-users",
      "group": "配置与 Xray",
      "title": "代理用户 API 与运行时查询",
      "where": "机制补充 · Control 管理 API（当前无独立 Dashboard 增删改面板）",
      "answer": "当前 Control 已有入站用户读写与运行时查询 API，Dashboard 未提供独立的代理用户增删改面板。默认 API 列表读期望配置，source=runtime 才经 Agent 读取 Xray；变更需要新配置版本应用。",
      "impact": "更改对应入站的代理授权",
      "steps": [
        {
          "title": "区分两种列表",
          "actor": "Control / Agent",
          "action": "期望列表来自 MongoDB 的受管配置；source=runtime 时发送 control:users:query，通过 Agent 查询 Xray。",
          "state": "运行时读取不改变授权。",
          "evidence": "查询返回的 revision 与用户列表可用于对照。"
        },
        {
          "title": "修改期望用户",
          "actor": "管理 API 调用方 → Control",
          "action": "提交新增、编辑或删除，携带 expectedRevision；Control 修改完整配置，而非直接由浏览器操作 Xray。",
          "state": "新 revision、users.create/update/remove 操作被保存。",
          "evidence": "接口返回 pending 后继续观察配置应用。"
        },
        {
          "title": "落实到运行时",
          "actor": "Agent → Xray",
          "action": "纯用户差异可通过私有 API 应用，同时保留完整配置用于重启恢复。",
          "state": "应用与健康确认后记录目标 revision。",
          "evidence": "核对运行时列表及 appliedRevision。"
        }
      ],
      "success": "期望列表与目标 revision 的运行时用户一致，Xray 健康。",
      "trap": "网站用户、会员与 Xray 入站用户是不同对象；已有底层 API 不能当作 Dashboard 已有同名操作按钮。",
      "failure": "Agent 不可用时不能把期望列表冒充运行列表；检查查询能力、入站 tag 与连接状态。",
      "sources": [
        {
          "path": "apps/control/src/modules/xray-users/handlers.ts",
          "line": 36
        },
        {
          "path": "apps/node-agent/src/reconcile/configuration.ts",
          "line": 203
        },
        {
          "path": "apps/web/src/features/nodes/NodeDetail.vue",
          "line": 31
        }
      ],
      "api": "GET 入站 users?source=runtime；用户 POST / PUT / DELETE",
      "next": "membership"
    },
    {
      "id": "domain",
      "group": "配置与 Xray",
      "title": "绑定 / 解绑节点域名",
      "where": "节点详情 → 域名与证书",
      "answer": "绑定域名先处理 Cloudflare DNS 和 Control 记录，不等于 TLS 证书已经签发或已应用到 Xray。",
      "impact": "DNS 与配置生效分别处理",
      "steps": [
        {
          "title": "检查服务端配置",
          "actor": "Control",
          "action": "ACME / Cloudflare 凭证由 Control 环境配置注入；页面读取其可用状态与区域。",
          "state": "Dashboard 不负责保存这些环境密钥。",
          "evidence": "域名服务已启用且配置完整。"
        },
        {
          "title": "绑定域名",
          "actor": "Control → Cloudflare → MongoDB",
          "action": "核验并同步受管 DNS 记录，保存域名绑定与证书管理记录。",
          "state": "DNS 绑定可用；证书仍有独立状态。",
          "evidence": "DNS 记录归属正确，绑定状态已保存。"
        },
        {
          "title": "解绑时分别确认",
          "actor": "管理员 → Control",
          "action": "解绑先删除受管 DNS，再移除 Control 绑定；此动作不证明已经从运行中 Xray 配置移除了 TLS。",
          "state": "DNS 删除、证书记录及运行配置需分别核对。",
          "evidence": "解绑结果成功，并检查当前协议配置是否还引用旧域名 / 证书。"
        }
      ],
      "success": "域名绑定与 DNS 状态符合预期；如用于 TLS，继续确认签发和配置应用。",
      "trap": "DNS 解析成功不能证明证书有效，更不能证明用户入口已授权。",
      "failure": "检查区域权限、记录冲突与删除失败；不要忽略仍在运行的旧 TLS 配置。",
      "sources": [
        {
          "path": "apps/control/src/modules/certificates/handlers.ts",
          "line": 12
        },
        {
          "path": "apps/control/src/modules/certificates/handlers.ts",
          "line": 32
        }
      ],
      "api": "PUT / DELETE /api/nodes/:id/domain",
      "next": "certificate"
    },
    {
      "id": "certificate",
      "group": "配置与 Xray",
      "title": "签发、续期与应用证书",
      "where": "节点详情 → 域名与证书",
      "answer": "签发成功与部署成功是两件事。Control 获取并保存证书，再生成含 TLS 材料的新节点配置，等待 Agent 应用。",
      "impact": "证书应用会改变 VMess / Trojan TLS 配置",
      "steps": [
        {
          "title": "提交续期或自动策略",
          "actor": "管理员 → Control",
          "action": "手动触发签发 / 续期，或设置自动续期；返回 202 表示请求受理。",
          "state": "保存续期请求或自动策略。",
          "evidence": "查看证书任务，而不是只看按钮提示。"
        },
        {
          "title": "签发并持久保存",
          "actor": "Control → ACME / DNS",
          "action": "后台任务申请证书，保存证书与账户材料；成功后等待配置应用任务。",
          "state": "证书存在 MongoDB，不代表节点已接收。",
          "evidence": "签发结果、有效期与错误明确可见。"
        },
        {
          "title": "写入并下发配置",
          "actor": "Control → Agent → Xray",
          "action": "应用任务将证书写入相关 VMess / Trojan TLS 配置，生成新 revision；重新应用可再次排队。",
          "state": "证书状态与节点配置状态分别推进。",
          "evidence": "目标 revision 已应用且 Xray 健康，再检查客户端 TLS。"
        }
      ],
      "success": "证书有效、配置已应用、Xray 健康；公网域名和 TLS 连接另外验证。",
      "trap": "签发成功不能代替部署成功；开启自动续期也不是证书已更新的证据。",
      "failure": "分开定位 DNS / ACME 签发失败和节点忙、能力不足、配置应用失败。",
      "sources": [
        {
          "path": "apps/control/src/modules/certificates/renewal.ts",
          "line": 1
        },
        {
          "path": "apps/control/src/modules/certificates/application.ts",
          "line": 1
        },
        {
          "path": "apps/control/src/modules/certificates/handlers.ts",
          "line": 86
        }
      ],
      "api": "POST certificate/renew；PUT certificate/automatic；POST certificate/apply",
      "next": "protocol"
    },
    {
      "id": "revision",
      "group": "配置与 Xray",
      "title": "保存后何时真正生效",
      "where": "适用于协议、用户、证书和会员授权",
      "answer": "以目标 revision 的应用结果和健康检查为准。desired 是 Control 想要的版本，attempted 是 Agent 尝试过的版本，applied 才是成功应用的版本。",
      "impact": "统一的配置执行链路",
      "steps": [
        {
          "title": "保存目标",
          "actor": "Control → MongoDB",
          "action": "以乐观并发检查保存完整配置和 operation；异步接口可能返回 pending / 202。",
          "state": "desiredRevision 前进；不承诺即时生效。",
          "evidence": "确认目标 revision，而不只是保存提示。"
        },
        {
          "title": "满足连接条件后下发",
          "actor": "Control → Agent",
          "action": "协调器仅向已确认、已报告的唯一有效连接推送，跳过不适宜并发的任务；使用稳定 requestId。",
          "state": "发送 control:configuration:apply，载荷为 revision、operation、完整 config。",
          "evidence": "失联期间保持待协调；不能假定浏览器等待即执行完成。"
        },
        {
          "title": "验证、执行与回执",
          "actor": "Agent → Xray → Control",
          "action": "配置验证、执行、健康检查和状态持久保存完成后才返回成功 ACK；失败或回滚不算目标成功。",
          "state": "ACK 携带 appliedRevision、attemptedRevision、status、healthy。",
          "evidence": "匹配 requestId 与目标 revision，并确认 applied 和 healthy。"
        },
        {
          "title": "超时后重新观测",
          "actor": "管理员 → Control",
          "action": "配置 ACK 超时为 60 秒。Control 无法据此判断远端一定失败；查看后续报告和 revision，再决定处理。",
          "state": "unknown 与 failed 区别保留。",
          "evidence": "旧健康状态、Socket 在线或 HTTP 202 都不能单独证明目标生效。"
        }
      ],
      "success": "目标 revision 已应用，Xray 健康；业务可用还需要真实客户端连接验证。",
      "trap": "在线 ≠ 健康；已保存 ≠ 已应用；超时 ≠ 一定失败；回滚成功 ≠ 目标成功。",
      "failure": "按保存冲突、连接条件、配置验证、执行、健康、回滚六个边界定位。",
      "sources": [
        {
          "path": "apps/control/src/modules/agents/dispatch.ts",
          "line": 20
        },
        {
          "path": "apps/control/src/modules/agents/configuration.ts",
          "line": 18
        },
        {
          "path": "apps/node-agent/src/reconcile/configuration.ts",
          "line": 162
        }
      ],
      "api": "control:configuration:apply → ACK；agent:status:report",
      "next": "status"
    },
    {
      "id": "pool",
      "group": "套餐与授权",
      "title": "管理节点池",
      "where": "节点池 → 创建 / 编辑",
      "answer": "节点池是套餐可使用的节点集合。把服务器加入池不会将“节点记录”广播给所有 Xray；相关会员授权由协调器按池计算。",
      "impact": "可能间接改变会员在各节点上的授权",
      "steps": [
        {
          "title": "选择实际节点",
          "actor": "管理员 → Control",
          "action": "创建或编辑池，提交节点 ID 与 expectedRevision；服务端验证节点存在。",
          "state": "保存池及其节点集合。",
          "evidence": "集合正确，版本更新成功。"
        },
        {
          "title": "检查套餐与授权约束",
          "actor": "Control",
          "action": "池被套餐绑定和已存在的授权引用时，删除节点等变更可能被拒绝，避免悬挂授权。",
          "state": "POOL_GRANTS_IN_USE 等冲突需先处理归属。",
          "evidence": "查看具体冲突，而不是反复提交。"
        },
        {
          "title": "等待会员协调",
          "actor": "Control → 节点配置",
          "action": "会员协调器读取有效会员及其套餐池，计算各节点需要的用户配置；有变化时产生新 revision。",
          "state": "每个节点独立执行，可能部分完成。",
          "evidence": "逐目标检查会员交付与节点 appliedRevision。"
        }
      ],
      "success": "池保存成功；涉及会员的变更已在目标节点完成协调。",
      "trap": "入池不等于节点已部署，也不等于所有网站用户都获得该节点。",
      "failure": "检查引用冲突、套餐归属及成员目标的 pending / failed 状态。",
      "sources": [
        {
          "path": "apps/control/src/modules/node-pools/handlers.ts",
          "line": 25
        },
        {
          "path": "apps/control/src/modules/memberships/reconcile.ts",
          "line": 24
        }
      ],
      "api": "节点池创建 / 更新（乐观并发）",
      "next": "plan"
    },
    {
      "id": "plan",
      "group": "套餐与授权",
      "title": "创建、发布、停止与关闭套餐",
      "where": "套餐 → 创建 / 状态操作",
      "answer": "套餐定义会员条件并绑定节点池。停止接纳与关闭套餐的效果不同：关闭会启动已归属授权的撤销。",
      "impact": "关闭套餐会间接撤销 Xray 用户",
      "steps": [
        {
          "title": "创建并校验规则",
          "actor": "管理员 → Control",
          "action": "设置节点池、周期、月流量等；检查池绑定归属。更新使用 expectedRevision。",
          "state": "保存套餐定义；已发布套餐编辑受限制。",
          "evidence": "套餐周期与池符合服务端约束。"
        },
        {
          "title": "发布或停止接纳",
          "actor": "管理员 → Control",
          "action": "发布前检查有效周期等条件；停止的套餐不再用于新开通，但既有会员不会仅因 stopped 立即失效。",
          "state": "套餐状态改变。",
          "evidence": "查看状态与现有会员，而非推断代理已全部被撤销。"
        },
        {
          "title": "关闭并撤销",
          "actor": "Control → 节点配置",
          "action": "关闭会触发后台撤销，按已归属绑定移除相应用户，避免删除无关配置。",
          "state": "撤销任务产生节点配置目标；离线节点无法即时完成。",
          "evidence": "检查撤销进度和各节点实际应用状态。"
        }
      ],
      "success": "套餐状态正确；关闭时还需确认授权撤销已应用。",
      "trap": "套餐管理不等于已实现支付或自动订单；本页描述当前的管理与手动开通链路。",
      "failure": "检查版本冲突、池独占约束、周期校验及撤销目标错误。",
      "sources": [
        {
          "path": "apps/control/src/modules/plans/handlers.ts",
          "line": 1
        },
        {
          "path": "apps/control/src/modules/plans/revocation.ts",
          "line": 48
        },
        {
          "path": "apps/control/src/modules/memberships/eligibility.ts",
          "line": 6
        }
      ],
      "api": "套餐创建 / 更新 / 状态切换；关闭异步撤销",
      "next": "membership"
    },
    {
      "id": "membership",
      "group": "套餐与授权",
      "title": "为用户开通会员",
      "where": "用户 → 开通会员",
      "answer": "开通会员会生成业务权益，并按套餐节点池生成对应 Xray 用户配置；HTTP 202 只表示交付开始。",
      "impact": "向目标节点增加会员代理授权",
      "steps": [
        {
          "title": "校验开通条件",
          "actor": "管理员 → Control",
          "action": "选择有效用户、已发布套餐与周期，携带套餐 revision 和幂等请求 ID。",
          "state": "创建会员权益，初始交付未必完成。",
          "evidence": "开通请求成功且没有重复创建会员。"
        },
        {
          "title": "计算节点目标",
          "actor": "Control",
          "action": "读取套餐池、有效期、账户和额度状态；为每个目标节点准备连接凭证与受管用户。",
          "state": "保存归属绑定和待应用目标。",
          "evidence": "查看目标节点集合与会员状态。"
        },
        {
          "title": "逐节点应用授权",
          "actor": "Control → Agent → Xray",
          "action": "协调器为发生变化的节点写完整配置；Agent 验证并应用。不同节点可以有不同结果。",
          "state": "交付可能 pending / partial / applied。",
          "evidence": "检查每个目标的配置结果，不只看会员记录存在。"
        },
        {
          "title": "交付客户端入口",
          "actor": "用户 → Control",
          "action": "订阅生成器仅交付当前可证明已确认配置及有效绑定的入口。",
          "state": "订阅交付不再改写 Xray。",
          "evidence": "开通完成后预览订阅并以真实客户端测试。"
        }
      ],
      "success": "会员有效、目标授权已应用，订阅包含符合条件的入口。",
      "trap": "“有会员记录”与“可以连接代理”不是同一个状态。",
      "failure": "检查套餐是否仍可用、节点池、用户状态、额度与逐节点交付错误。",
      "sources": [
        {
          "path": "apps/control/src/modules/users/handlers.ts",
          "line": 39
        },
        {
          "path": "apps/control/src/modules/memberships/reconcile.ts",
          "line": 24
        },
        {
          "path": "apps/control/src/modules/subscriptions/endpoints.ts",
          "line": 117
        }
      ],
      "api": "手动开通会员 → 后台协调 → 订阅生成",
      "next": "subscription"
    },
    {
      "id": "campaign",
      "group": "套餐与授权",
      "title": "活动与领取",
      "where": "活动管理 / 用户领取入口",
      "answer": "活动领取创建会员权益，再复用会员交付流程。领取成功不表示所有目标节点已经应用授权。",
      "impact": "经会员协调间接增加代理授权",
      "steps": [
        {
          "title": "建立活动",
          "actor": "管理员 → Control",
          "action": "基于有效套餐创建活动快照，检查资源归属、时间、名额与领取限制。",
          "state": "保存活动及其可交付权益。",
          "evidence": "活动配置与实际套餐条件一致。"
        },
        {
          "title": "原子领取",
          "actor": "用户 → Control",
          "action": "按账户检查领取资格并原子占用名额，避免并发重复领取。",
          "state": "记录领取与待交付状态。",
          "evidence": "区分已领取、领取受理和会员已创建。"
        },
        {
          "title": "补偿与交付",
          "actor": "Control",
          "action": "创建会员，后台补偿未完成的交付，再按会员节点目标下发配置。",
          "state": "活动领取和会员节点应用分开追踪。",
          "evidence": "会员交付完成，并能获得对应订阅入口。"
        }
      ],
      "success": "领取记录、会员权益和节点交付均完成。",
      "trap": "活动额度是业务规则，不表示每个节点已同步或实现实时硬限速。",
      "failure": "先区分资格 / 名额错误与领取后的会员交付错误。",
      "sources": [
        {
          "path": "apps/control/src/modules/campaigns/handlers.ts",
          "line": 34
        },
        {
          "path": "apps/control/src/modules/memberships/reconcile.ts",
          "line": 24
        }
      ],
      "api": "活动创建 / 领取 → 会员交付",
      "next": "membership"
    },
    {
      "id": "account",
      "group": "套餐与授权",
      "title": "网站用户与会员状态",
      "where": "用户 → 详情（状态只读）",
      "answer": "当前 Dashboard 支持查询网站用户与会员、手动开通会员；未发现停用账户按钮或对应管理更新接口。底层资格判断已处理 user-disabled，账户停用后的撤销机制与页面可执行操作需要分开。",
      "impact": "查询不改 Xray；账户被停用后的协调会撤销授权",
      "steps": [
        {
          "title": "查询网站账户",
          "actor": "管理员 → Control",
          "action": "在用户管理中搜索账户并打开详情，查看账户状态、会员和用量。此处没有账户状态编辑入口。",
          "state": "只读查询，不修改授权。",
          "evidence": "确认账户身份、active / disabled 状态和会员列表。"
        },
        {
          "title": "理解状态判定",
          "actor": "Control",
          "action": "资格判断检查账户 active、会员有效期、套餐关闭和额度状态。如果账户已被其他途径停用，会员会被判为 user-disabled。",
          "state": "这是底层条件处理，不是当前页面能执行的按钮。",
          "evidence": "会员状态应与实际账户及权益条件一致。"
        },
        {
          "title": "跟踪授权变化",
          "actor": "Control → Agent → Xray",
          "action": "被阻断会员的受管授权由协调器移除，逐节点等待应用；页面查询本身不会触发账户停用。",
          "state": "可能先处于 pausing，再确认 paused。",
          "evidence": "检查目标撤销结果；离线节点不能据此承诺即时停用。"
        }
      ],
      "success": "用户与会员状态可读，能明确区分待交付、已应用与被阻断；当前页面不提供账户停用操作。",
      "trap": "资格判断支持 user-disabled，不代表 Dashboard 已实现“停用用户”按钮。",
      "failure": "会员被阻断时检查账户、套餐、有效期与额度；按目标配置定位交付问题，不要寻找不存在的停用操作。",
      "sources": [
        {
          "path": "apps/control/src/routes/users.ts",
          "line": 4
        },
        {
          "path": "apps/control/src/modules/memberships/eligibility.ts",
          "line": 6
        },
        {
          "path": "apps/control/src/modules/memberships/reconcile.ts",
          "line": 24
        }
      ],
      "api": "GET /api/users；GET /api/users/:id；POST /api/users/:id/memberships",
      "next": "revision"
    },
    {
      "id": "billing",
      "group": "用量与额度",
      "title": "节点用量倍率与方向",
      "where": "节点详情 → 用量规则",
      "answer": "规则改变 Control 对后续用量的计费口径，不会改变 Xray 原始字节计数，也不是带宽限制。",
      "impact": "不直接改写 Xray",
      "steps": [
        {
          "title": "读取当前版本",
          "actor": "管理员 → Control",
          "action": "查看规则 revision、方向与倍率；更新使用 expectedRevision。",
          "state": "方向区分上下行或双向，倍率以百分之一单位存储。",
          "evidence": "确认规则针对的节点。"
        },
        {
          "title": "保存新生效点",
          "actor": "Control → MongoDB",
          "action": "追加带 effectiveAt 的新规则版本；每条用量以采样区间起始时间选择规则，跨规则生效点的区间不拆分重算。",
          "state": "历史已计费用量不会因为新规则被重算。",
          "evidence": "规则 revision 与生效时间可核对。"
        },
        {
          "title": "观察账单口径",
          "actor": "Control",
          "action": "保留原始和计费口径的区别；后续会员额度判断读取计费用量。",
          "state": "规则可间接影响何时触发额度软暂停。",
          "evidence": "对照方向、倍率、时间段与计费总量。"
        }
      ],
      "success": "新规则保存，后续用量按时间与规则版本处理。",
      "trap": "倍率 2 倍不等于 Xray 实际传输字节翻倍；也不会使客户端限速。",
      "failure": "检查规则版本冲突和方向 / 倍率输入；区分采样缺口与正常零用量。",
      "sources": [
        {
          "path": "apps/control/src/modules/usage/handlers.ts",
          "line": 8
        },
        {
          "path": "apps/control/src/modules/usage/store.ts",
          "line": 45
        },
        {
          "path": "apps/control/src/modules/memberships/quota.ts",
          "line": 5
        },
        {
          "path": "apps/control/src/modules/usage/billing.ts",
          "line": 7
        }
      ],
      "api": "PUT /api/nodes/:id/billing",
      "next": "quota"
    },
    {
      "id": "usage",
      "group": "用量与额度",
      "title": "用量从哪里来",
      "where": "节点详情 → 用量",
      "answer": "Agent 读取 Xray 累计计数器并形成增量，通过本地 SQLite 队列上报；Control 去重入账并按规则汇总，页面展示的是这条链路的结果。",
      "impact": "只读统计不主动清零计数器",
      "steps": [
        {
          "title": "采样并识别运行实例",
          "actor": "Agent → Xray / Docker",
          "action": "约每 15 秒读取统计及运行身份，比较前后实例以识别重启边界；不可用或缺口不能编造成零。",
          "state": "原始采样与增量先留在节点侧。",
          "evidence": "检查采样时间、能力与覆盖范围。"
        },
        {
          "title": "持久排队与上报",
          "actor": "Agent → SQLite → Control",
          "action": "约每 60 秒封包，本地持久保存后发送 agent:usage:report；匹配 ACK 才移除待发记录。",
          "state": "离线时存在未交付批次。",
          "evidence": "上报成功不等于每个汇总投影都已更新。"
        },
        {
          "title": "去重与计价",
          "actor": "Control → MongoDB",
          "action": "按节点、Agent store 和批次序号识别重复；内容冲突拒绝；保存账本并处理汇总投影。",
          "state": "原始与计费用量分别保留，可能有投影等待。",
          "evidence": "观察 stream、新鲜度、覆盖和待投影状态。"
        }
      ],
      "success": "数据新鲜、覆盖正常、上报和汇总无积压；数值含义与倍率口径一致。",
      "trap": "页面的 — / 不可用不等于 0；应用源码分析也不能证明真实流量计量误差已经验收。",
      "failure": "沿采样 → 本地队列 → Socket 上报 → 入账 → 投影逐段查，不要先手工重置计数器。",
      "sources": [
        {
          "path": "apps/control/src/modules/usage/store.ts",
          "line": 67
        },
        {
          "path": "docs/agent-communication.md",
          "line": 1
        },
        {
          "path": "apps/node-agent/src/usage/collection.ts",
          "line": 93
        }
      ],
      "api": "agent:usage:report；GET /api/nodes/:id/usage",
      "next": "takeover"
    },
    {
      "id": "quota",
      "group": "用量与额度",
      "title": "月额度耗尽后会怎样",
      "where": "会员状态 / 用量",
      "answer": "当前代码实现额度软暂停：Control 定期检查计费月用量，达到额度后标记会员，再通过配置协调撤销授权。它不是 Xray 实时硬限额。",
      "impact": "超额后异步撤销受管代理用户",
      "steps": [
        {
          "title": "检查计费总量",
          "actor": "Control",
          "action": "有效会员的额度检查受约 15 秒节流，月份以 UTC 计算；读取该会员当月计费总量。",
          "state": "已耗尽月份保存在会员记录中。",
          "evidence": "检查计费口径、会员额度与月份。"
        },
        {
          "title": "标记并撤销授权",
          "actor": "Control → Agent → Xray",
          "action": "达到额度后状态变 quota-exhausted；协调器阻断授权，等待各目标应用。",
          "state": "服务状态先 pausing，确认撤销后才 paused。",
          "evidence": "目标节点应用结果均确认且无错误。"
        },
        {
          "title": "新月重新协调",
          "actor": "Control",
          "action": "新 UTC 月份清除旧耗尽标记，再恢复符合其他条件的会员授权。",
          "state": "恢复同样需要节点应用，不是时钟一到立即恢复。",
          "evidence": "有效期、账户、套餐和节点交付均满足要求。"
        }
      ],
      "success": "额度状态与当月计费总量一致，暂停 / 恢复的目标配置已确认。",
      "trap": "采样、封包、入账、检查和节点应用都有延迟，离线节点也可能继续接受旧授权；不能承诺精确到字节的即时断流。",
      "failure": "检查月份、汇总积压和目标配置状态；paused 与 pausing 必须区分。",
      "sources": [
        {
          "path": "apps/control/src/modules/memberships/quota.ts",
          "line": 5
        },
        {
          "path": "apps/control/src/modules/memberships/eligibility.ts",
          "line": 6
        },
        {
          "path": "apps/control/src/modules/memberships/reconcile.ts",
          "line": 24
        }
      ],
      "api": "用量汇总 → 额度检查 → 会员授权协调",
      "next": "billing"
    },
    {
      "id": "takeover",
      "group": "用量与额度",
      "title": "恢复用量账本上传身份",
      "where": "节点详情 → 用量接管",
      "answer": "这是更换 Agent 用量 store 身份的显式恢复操作。它永久退役旧上传者，保留历史总量，并记录覆盖缺口；不是日常刷新按钮。",
      "impact": "更换 Control 接收的上传身份，不改 Xray",
      "steps": [
        {
          "title": "核实确需接管",
          "actor": "管理员",
          "action": "确认旧 Agent store 与新 store 身份。服务端要求旧流超过 120 秒未采集、无待投影批次，且新旧身份不同。",
          "state": "有并发或身份冲突时拒绝。",
          "evidence": "核对真实恢复场景，避免误换活跃上传者。"
        },
        {
          "title": "显式提交新身份",
          "actor": "Control → MongoDB",
          "action": "使用 expectedStoreId 与 newStoreId 更新接收游标，并把旧 store 永久加入退役集合。",
          "state": "新序号从头接收；历史总量保持。",
          "evidence": "接收身份变为目标 newStoreId。"
        },
        {
          "title": "检查覆盖与上报",
          "actor": "Agent → Control",
          "action": "等待新上传者交付批次；当月会标记缺口，不能把缺口当成完整零流量。",
          "state": "coverageSince 和缺口月份更新。",
          "evidence": "新批次入账，旧身份不再能上传。"
        }
      ],
      "success": "新 store 正常上报，历史总量仍在，缺口明确可见。",
      "trap": "接管不会重建丢失的历史采样，也不会自动重置 Xray 统计。",
      "failure": "409 时核对旧身份、120 秒条件、待投影和退役列表，不要反复强制提交。",
      "sources": [
        {
          "path": "apps/control/src/modules/usage/handlers.ts",
          "line": 17
        },
        {
          "path": "apps/control/src/modules/usage/store.ts",
          "line": 198
        }
      ],
      "api": "POST /api/nodes/:id/usage/takeover",
      "next": "usage"
    },
    {
      "id": "subscription",
      "group": "订阅与连接",
      "title": "下载 / 预览订阅",
      "where": "用户账户 / 订阅入口",
      "answer": "订阅读取 Control 中的权益与已确认配置，生成客户端内容；下载订阅不会再往 Xray 同步用户。",
      "impact": "读取交付；不改 Xray",
      "steps": [
        {
          "title": "校验访问身份",
          "actor": "用户 → Control",
          "action": "通过独立订阅 token 识别用户，检查账户及请求格式 / 协议参数。",
          "state": "token 不是网站密码或代理连接码。",
          "evidence": "入口有效且用户允许访问。"
        },
        {
          "title": "筛选可交付节点",
          "actor": "Control",
          "action": "检查会员、节点池、连接凭证与归属绑定；需要能证明当前配置已确认，不能只凭旧快照。",
          "state": "普通订阅没有就绪入口时返回 409；全部会员因额度暂停时，改为返回对应客户端格式的状态说明配置，不交付真实代理凭证。",
          "evidence": "预览实际客户端内容，确认格式与入口。"
        },
        {
          "title": "客户端导入并测试",
          "actor": "用户 → 客户端 → Xray",
          "action": "Clash Verge Rev 使用 YAML，Surge 使用配置文本，v2rayN / v2rayNG 使用 Base64 URI 列表等对应格式。客户端连接目标 Xray，代理流量不经 Control 数据库转发。",
          "state": "客户端是否刷新订阅是独立行为。",
          "evidence": "实际连接、域名、端口和凭证测试通过。"
        }
      ],
      "success": "生成客户端支持的配置，包含正确权益下的入口，并能真实连接。",
      "trap": "下载成功不证明代理已连通；订阅 token 与每个会员的连接码是两类凭证。",
      "failure": "检查 token、会员状态、目标配置确认与客户端格式；没有入口时先修复交付条件。",
      "sources": [
        {
          "path": "apps/control/src/modules/subscriptions/handlers.ts",
          "line": 1
        },
        {
          "path": "apps/control/src/modules/subscriptions/endpoints.ts",
          "line": 117
        }
      ],
      "api": "GET /sub/:token",
      "next": "reset-token"
    },
    {
      "id": "reset-token",
      "group": "订阅与连接",
      "title": "重置订阅地址",
      "where": "账户 → 订阅凭证",
      "answer": "重置的是订阅下载 token。旧地址不再能获取新订阅，但已经导入客户端的代理配置不会因此自动失效。",
      "impact": "不直接改 Xray 代理用户",
      "steps": [
        {
          "title": "验证账户与冷却",
          "actor": "Control",
          "action": "认证账户并检查重置冷却时间。",
          "state": "冷却中可返回 429。",
          "evidence": "确认要更换的是订阅地址。"
        },
        {
          "title": "轮换下载 token",
          "actor": "Control → MongoDB",
          "action": "保存新的订阅 token 并返回新地址。",
          "state": "旧 token 不再有效；代理连接码保持。",
          "evidence": "新地址能获取配置，旧地址被拒绝。"
        },
        {
          "title": "更新客户端地址",
          "actor": "用户",
          "action": "将新订阅地址更新到需要的客户端；如果代理凭证泄露，还需另行重置连接码。",
          "state": "本操作不撤销已缓存的代理凭证。",
          "evidence": "客户端刷新新地址成功。"
        }
      ],
      "success": "新订阅地址可用，旧地址不能再拉取订阅。",
      "trap": "要让旧代理密码失效，应处理连接码；仅更换订阅 URL 达不到这个目标。",
      "failure": "检查账户认证和冷却时间；不要把 429 当作 Xray 故障。",
      "sources": [
        {
          "path": "apps/control/src/modules/account/handlers.ts",
          "line": 125
        }
      ],
      "api": "POST /api/account/subscription-credentials/reset",
      "next": "reset-code"
    },
    {
      "id": "reset-code",
      "group": "订阅与连接",
      "title": "重置会员连接码",
      "where": "账户 → 对应会员连接码",
      "answer": "连接码用于代理授权。轮换后需要向该会员相关节点应用新配置；旧码何时失效取决于各节点实际应用进度。",
      "impact": "改变对应会员的 Xray 用户凭证",
      "steps": [
        {
          "title": "验证会员与冷却",
          "actor": "Control",
          "action": "检查账户归属、会员有效性和轮换冷却。",
          "state": "无权或未满足条件时拒绝。",
          "evidence": "确认选择了正确的会员。"
        },
        {
          "title": "保存新码并交付",
          "actor": "Control → 节点配置",
          "action": "轮换会员连接码，返回 202 pending；协调器为相关节点更新受管用户。",
          "state": "新旧码在传播期间可能出现节点间差异。",
          "evidence": "观察所有目标的授权应用状态。"
        },
        {
          "title": "客户端刷新并验证",
          "actor": "用户 → 客户端",
          "action": "节点应用完成后刷新订阅 / 更新凭证，验证新码可用及旧码不再获准。",
          "state": "离线节点需要恢复协调后再确认。",
          "evidence": "不能仅用网页显示新码判断撤销完成。"
        }
      ],
      "success": "相关节点已应用新凭证，客户端用新码连接正常。",
      "trap": "重置连接码与重置订阅 token 不能相互替代。",
      "failure": "检查权限、冷却、会员状态与逐节点目标；旧码仍可用时先定位哪个节点未应用。",
      "sources": [
        {
          "path": "apps/control/src/modules/account/handlers.ts",
          "line": 156
        },
        {
          "path": "apps/control/src/modules/memberships/reconcile.ts",
          "line": 24
        }
      ],
      "api": "POST /api/account/memberships/:id/connection-code/reset",
      "next": "revision"
    },
    {
      "id": "status",
      "group": "观测与维护",
      "title": "读懂总览与节点状态",
      "where": "Dashboard / 节点详情 → 运行信息",
      "answer": "把连接、最近报告、Xray 健康和配置版本分别看。一个绿色在线标记不足以证明代理可用。",
      "impact": "观察状态，不改 Xray",
      "steps": [
        {
          "title": "看当前连接",
          "actor": "Web → Control",
          "action": "读取当前 Control 进程中的活动 Socket，区分握手确认与是否已收到本次连接的有效报告。",
          "state": "Control 重启后重新观测，不提供历史断线原因。",
          "evidence": "无连接和连接信息不可用需区分。"
        },
        {
          "title": "看报告新鲜度与健康",
          "actor": "Web → Control",
          "action": "节点在线判断采用最近报告约 30 秒阈值；Xray 健康由 Agent 报告，未知指标应显示不可用。",
          "state": "lastSeen、连接和 Xray healthy 不是同一个字段。",
          "evidence": "检查最新报告时间与 Xray 状态。"
        },
        {
          "title": "看配置与业务结果",
          "actor": "管理员",
          "action": "对照 desired、attempted、applied，并检查会员交付、订阅入口和真实客户端。",
          "state": "当前页面通常每 5 秒刷新，不是实时事件流。",
          "evidence": "目标配置匹配且客户端实际可连接。"
        }
      ],
      "success": "连接有效、报告新鲜、Xray 健康、目标配置已应用，并通过需要的客户端验证。",
      "trap": "流量数据缺失不是 0；Socket 连接存在不代表 Xray 健康；SSH 可用也不代表 Agent 在线。",
      "failure": "按连接 → 报告 → 健康 → revision → 客户端网络逐项定位。",
      "sources": [
        {
          "path": "apps/web/src/features/nodes/nodes.composable.ts",
          "line": 17
        },
        {
          "path": "apps/web/src/features/dashboard/DashboardPage.vue",
          "line": 1
        },
        {
          "path": "docs/agent-communication.md",
          "line": 11
        }
      ],
      "api": "GET 节点列表 / 详情；页面轮询",
      "next": "usage"
    },
    {
      "id": "optimization",
      "group": "观测与维护",
      "title": "节点优化",
      "where": "节点详情 → 优化",
      "answer": "优化会修改实际宿主机参数和 / 或 Xray 配置。先生成带环境与配置版本约束的计划，确认后再执行。",
      "impact": "可能更改宿主机网络参数及 Xray 配置",
      "steps": [
        {
          "title": "检查并生成计划",
          "actor": "Control → SSH",
          "action": "读取宿主机能力、资源和当前配置；计划绑定 expectedRevision、主机状态与有效期。",
          "state": "生成受校验的 planToken，尚未完成优化。",
          "evidence": "先阅读具体计划与前置条件。"
        },
        {
          "title": "确认并执行",
          "actor": "Control → SSH / Agent",
          "action": "提交计划后重新检查环境是否变化，执行对应宿主机设置，再通过配置通道应用相关 Xray 设置。",
          "state": "任务运行中；与部署等任务互斥。",
          "evidence": "观察 SSH 与配置应用两个阶段。"
        },
        {
          "title": "确认或恢复",
          "actor": "Control",
          "action": "执行失败时尝试宿主机 / 配置恢复；发布结果未知时需先确认远端状态。",
          "state": "完成、失败与未知需区别。",
          "evidence": "最终主机状态、Xray 健康和 revision 均符合目标。"
        }
      ],
      "success": "优化任务完成，实际主机与 Xray 状态符合计划；性能改善需单独测量。",
      "trap": "“优化完成”不等于延迟或吞吐必然改善；不能仅凭参数名保证性能。",
      "failure": "检查计划过期、环境改变、资源不足、SSH 执行、配置发布及恢复结果。",
      "sources": [
        {
          "path": "apps/control/src/modules/optimization/handlers.ts",
          "line": 29
        }
      ],
      "api": "先生成优化计划，再提交 planToken 执行",
      "next": "status"
    },
    {
      "id": "remove-node",
      "group": "观测与维护",
      "title": "删除节点",
      "where": "节点管理 → 删除",
      "answer": "删除只移除 Control 中的节点记录，不会登录服务器卸载 Agent、Xray 或清理远程配置。",
      "impact": "远程服务保留；不等于停服",
      "steps": [
        {
          "title": "先处理归属与服务",
          "actor": "管理员",
          "action": "检查节点池、会员与实际业务，安排迁移或撤销并确认应用；单纯删除记录不能替代远端停用。",
          "state": "业务迁移与远程清理是独立操作。",
          "evidence": "确认仍需运行的用户已迁移。"
        },
        {
          "title": "删除 Control 记录",
          "actor": "管理员 → Control",
          "action": "服务端拒绝正在部署的节点删除；删除管理记录。",
          "state": "节点不再由原记录正常管理。",
          "evidence": "列表中记录移除。"
        },
        {
          "title": "另行管理远端",
          "actor": "管理员",
          "action": "如需卸载，应另行检查服务器并执行明确的卸载操作；本说明站不会执行。",
          "state": "远程容器、文件与端口不会因记录消失自动清理。",
          "evidence": "通过服务器实际检查确认是否仍有服务。"
        }
      ],
      "success": "Control 记录移除；是否停服或卸载必须由另外的远端检查确认。",
      "trap": "从 Dashboard 消失不代表服务器上的代理停止运行。",
      "failure": "先处理部署忙等冲突；删除前保证不会失去需要的管理和撤销路径。",
      "sources": [
        {
          "path": "apps/control/src/modules/nodes/handlers.ts",
          "line": 190
        }
      ],
      "api": "DELETE /api/nodes/:id",
      "next": "status"
    }
  ]
};
