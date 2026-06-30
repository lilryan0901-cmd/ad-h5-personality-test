"use strict";

/*
 * CommQuant 规则型评分引擎
 * 所有可调整的词表、理论链、维度与阈值集中在 SCORING_CONFIG。
 * 页面渲染、存储和导出逻辑位于文件后半部分。
 */
const SCORING_CONFIG = {
  version: "1.4.0",
  storageKey: "commquant-paper-worthiness-v1",
  resultKey: "commquant-paper-worthiness-result-v1",
  calibrationKey: "commquant-calibration-result-v1",
  externalCaseKey: "commquant-external-case-bank-v1",
  correctionKey: "commquant-misclassification-corrections-v1",
  gradeThresholds: [
    { grade: "A", min: 4.2 },
    { grade: "B", min: 3.4 },
    { grade: "C", min: 2.6 },
    { grade: "D", min: 1.8 },
    { grade: "E", min: 0 }
  ],
  gradeOrder: ["A", "B", "C", "D", "E"],
  calibration: {
    caseTypes: [
      "成熟方案", "设计不完整", "概念包装",
      "数据不匹配", "方法越界", "文献锚定薄弱",
      "真实研究计划", "课程作业", "投稿前诊断", "其他"
    ],
    misclassificationReasons: {
      tooStrict: "规则过严",
      tooLoose: "规则过松",
      insufficientInput: "输入材料不足",
      duplicateDowngrade: "降级规则重复惩罚",
      weakLiteratureCheck: "文献锚定判断不足",
      weakMethodCheck: "方法风险识别不足"
    },
    adjustmentDirections: {
      overestimate: "提高关键缺失、证据错位与方法越界规则的敏感度，并检查是否缺少硬性降级。",
      underestimate: "检查长度阈值、关键词覆盖与同类降级规则，避免完整方案被形式性缺失过度压低。"
    },
    caseStatuses: ["待标注", "已标注", "已校准", "需复核", "已废弃"],
    finalDecisions: ["继续", "重构", "放弃", "暂缓"],
    tags: [
      "传播学锚定不足", "数据不匹配", "数据堆砌", "变量无理论依据",
      "变量操作化不足", "分析单位混乱", "因果越界", "方法不匹配",
      "文献锚定薄弱", "理论增量不足", "可修补", "不建议继续"
    ]
  },
  reportModes: {
    full: "完整诊断版",
    advisor: "导师沟通版",
    showcase: "产品展示版"
  },
  hardRuleDefinitions: [
    { id: 1, name: "学科归属不足", cap: "C" },
    { id: 2, name: "数据无法验证核心问题", cap: "C" },
    { id: 3, name: "对象与数据库不对应", cap: "C" },
    { id: 4, name: "变量缺少传播学依据", cap: "C" },
    { id: 5, name: "分析单位混乱", cap: "C" },
    { id: 6, name: "相关写成因果", cap: "C" },
    { id: 7, name: "数据来源或抓取缺失", cap: "D" },
    { id: 8, name: "核心变量无法操作化", cap: "D" },
    { id: 9, name: "海量数据无连接", cap: "D" },
    { id: 10, name: "无文献锚定", cap: "C" },
    { id: 11, name: "基础方法硬伤", cap: "C" },
    { id: 12, name: "内容数据证明效果", cap: "C" },
    { id: 13, name: "互动指标代理越界", cap: "C" },
    { id: 14, name: "复杂方法与问题不匹配", cap: "C" }
  ],
  dimensionTraceFields: {
    1: ["title", "background", "researchQuestions", "researchObject"],
    2: ["background", "researchQuestions"],
    3: ["theory", "researchQuestions"],
    4: ["dataSource"],
    5: ["scrapingPlan", "timeWindow", "samplingRules"],
    6: ["researchObject", "dataSource"],
    7: ["dataSource", "timeWindow", "unitOfAnalysis"],
    8: ["independentVariables", "theory"],
    9: ["dependentVariables", "theory"],
    10: ["mechanismVariables", "theory"],
    11: ["independentVariables", "dependentVariables", "methods"],
    12: ["unitOfAnalysis"],
    13: ["methods", "dependentVariables"],
    14: ["methods", "robustness"],
    15: ["samplingRules", "methods", "ethics"],
    16: ["methods", "robustness", "expectedConclusion"],
    17: ["robustness"],
    18: ["literature"],
    19: ["targetJournal", "literature", "theory"]
  },
  designCompleteness: {
    items: [
      { id: "researchQuestions", label: "研究问题", field: "researchQuestions", minLength: 18 },
      { id: "theory", label: "理论基础", field: "theory", minLength: 35 },
      { id: "literature", label: "CSSCI/SSCI 文献锚定", field: "literature", minLength: 80, rule: "literature" },
      { id: "researchObject", label: "研究对象", field: "researchObject", minLength: 15 },
      { id: "unitOfAnalysis", label: "分析单位", field: "unitOfAnalysis", minLength: 6, rule: "unit" },
      { id: "dataSource", label: "数据来源", field: "dataSource", minLength: 35 },
      { id: "scrapingPlan", label: "数据抓取方案", field: "scrapingPlan", minLength: 80, rule: "scraping" },
      { id: "timeWindow", label: "时间窗口", field: "timeWindow", minLength: 12 },
      { id: "samplingRules", label: "样本筛选规则", field: "samplingRules", minLength: 30 },
      { id: "independentVariables", label: "自变量", field: "independentVariables", minLength: 30 },
      { id: "dependentVariables", label: "因变量", field: "dependentVariables", minLength: 30 },
      { id: "mechanismVariables", label: "机制变量", field: "mechanismVariables", minLength: 25 },
      { id: "controlVariables", label: "控制变量", field: "controlVariables", minLength: 25 },
      { id: "methods", label: "方法模型", field: "methods", minLength: 80 },
      { id: "robustness", label: "稳健性检验", field: "robustness", minLength: 35 },
      { id: "ethics", label: "伦理说明", field: "ethics", minLength: 25 },
      { id: "expectedConclusion", label: "结论边界", field: "expectedConclusion", minLength: 35, rule: "boundary" }
    ],
    thresholds: [
      { min: 80, label: "可进入正式评估" },
      { min: 60, label: "可初评，但结论需谨慎" },
      { min: 40, label: "只能做选题诊断" },
      { min: 0, label: "信息不足，不建议给出明确等级" }
    ],
    insufficientWarning: "当前材料不足以判断论文是否值得写，只能识别初步风险。"
  },
  fields: [
    "title", "targetJournal", "background", "researchQuestions", "theory",
    "literature", "researchObject", "unitOfAnalysis", "dataSource",
    "scrapingPlan", "timeWindow", "samplingRules", "independentVariables",
    "dependentVariables", "mechanismVariables", "controlVariables",
    "methods", "robustness", "ethics", "expectedConclusion"
  ],
  fieldLabels: {
    title: "论文题目",
    targetJournal: "目标期刊",
    background: "研究背景",
    researchQuestions: "研究问题",
    theory: "理论基础",
    literature: "文献锚定",
    researchObject: "研究对象",
    unitOfAnalysis: "分析单位",
    dataSource: "数据来源",
    scrapingPlan: "抓取方案",
    timeWindow: "时间窗口",
    samplingRules: "样本规则",
    independentVariables: "自变量",
    dependentVariables: "因变量",
    mechanismVariables: "机制变量",
    controlVariables: "控制变量",
    methods: "研究方法",
    robustness: "稳健性",
    ethics: "伦理说明",
    expectedConclusion: "预期结论"
  },
  modes: {
    quick: {
      name: "快速选题诊断",
      dimensions: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11],
      relevantFields: [
        "title", "background", "researchQuestions", "theory", "researchObject",
        "dataSource", "independentVariables", "dependentVariables", "mechanismVariables"
      ],
      ignoredFields: [
        "targetJournal", "literature", "unitOfAnalysis", "scrapingPlan",
        "timeWindow", "samplingRules", "controlVariables", "methods",
        "robustness", "ethics", "expectedConclusion"
      ],
      keyFields: [
        "researchQuestions", "researchObject", "dataSource",
        "independentVariables", "dependentVariables"
      ]
    },
    full: {
      name: "完整研究计划诊断",
      dimensions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      relevantFields: [
        "title", "targetJournal", "background", "researchQuestions", "theory",
        "literature", "researchObject", "unitOfAnalysis", "dataSource",
        "scrapingPlan", "timeWindow", "samplingRules", "independentVariables",
        "dependentVariables", "mechanismVariables", "controlVariables",
        "methods", "robustness", "ethics", "expectedConclusion"
      ],
      keyFields: [
        "researchQuestions", "theory", "researchObject", "unitOfAnalysis",
        "dataSource", "scrapingPlan", "independentVariables",
        "dependentVariables", "methods"
      ]
    }
  },
  quickAxes: [
    { id: "question", name: "核心 I：传播问题成立性", dimensions: [1, 2, 3] },
    { id: "data-possibility", name: "核心 II：对象与数据可能性", dimensions: [4, 6, 7] },
    { id: "variable-logic", name: "核心 III：变量初步逻辑", dimensions: [8, 9, 10, 11] }
  ],
  axes: [
    { id: "discipline", name: "轴心 I：传播学问题成立性", dimensions: [1, 2, 3] },
    { id: "data", name: "轴心 II：数据与对象匹配", dimensions: [4, 5, 6, 7] },
    { id: "variables", name: "轴心 III：变量与理论逻辑", dimensions: [8, 9, 10, 11] },
    { id: "methods", name: "轴心 IV：方法与统计规范", dimensions: [12, 13, 14, 15, 16, 17] },
    { id: "publication", name: "轴心 V：文献增量与发表价值", dimensions: [18, 19] }
  ],
  dimensions: [
    { id: 1, axis: "discipline", name: "学科归属" },
    { id: 2, axis: "discipline", name: "问题真实度" },
    { id: 3, axis: "discipline", name: "理论问题清晰度" },
    { id: 4, axis: "data", name: "数据来源依据" },
    { id: 5, axis: "data", name: "数据抓取合理性" },
    { id: 6, axis: "data", name: "研究对象与数据库对应性" },
    { id: 7, axis: "data", name: "数据关联性" },
    { id: 8, axis: "variables", name: "自变量传播学依据" },
    { id: 9, axis: "variables", name: "因变量传播学依据" },
    { id: 10, axis: "variables", name: "机制变量逻辑" },
    { id: 11, axis: "variables", name: "概念操作化与测量效度" },
    { id: 12, axis: "methods", name: "分析单位清晰度" },
    { id: 13, axis: "methods", name: "模型选择合理性" },
    { id: 14, axis: "methods", name: "基础统计错误控制" },
    { id: 15, axis: "methods", name: "社会研究方法错误控制" },
    { id: 16, axis: "methods", name: "计量经济学错误控制" },
    { id: 17, axis: "methods", name: "稳健性与不确定性处理" },
    { id: 18, axis: "publication", name: "CSSCI/SSCI 文献锚定" },
    { id: 19, axis: "publication", name: "理论增量与期刊适配" }
  ],
  keywords: {
    communicationCore: [
      "传播", "媒介", "媒体", "新闻", "平台", "受众", "舆论", "内容生产", "内容流通",
      "框架", "议程", "扩散", "认同", "互动", "参与", "国际传播", "公共传播",
      "政策传播", "媒介组织", "平台权力", "算法推荐", "可见性", "注意力", "信息接触"
    ],
    realityProblem: [
      "矛盾", "争议", "困境", "变化", "差异", "偏差", "不平等", "失灵", "张力",
      "现象", "问题", "缺口", "不足", "尚不清楚", "为何", "如何", "机制"
    ],
    theoreticalLogic: [
      "理论", "机制", "路径", "解释", "假设", "中介", "调节", "认知", "态度",
      "行为", "归因", "议程", "框架", "动机", "认同", "意见气候", "可见性"
    ],
    operation: [
      "编码", "测量", "定义", "量表", "指标", "分类", "操作化", "例句", "取值",
      "训练集", "验证集", "变量", "字段", "人工标注", "字典"
    ],
    causalWords: [
      "因果", "影响", "导致", "促进", "抑制", "效应", "作用于", "提升", "降低",
      "驱动", "决定", "使得"
    ],
    causalDesign: [
      "对照组", "处理组", "前后比较", "事件窗口", "平行趋势", "固定效应", "工具变量",
      "断点", "匹配", "随机", "自然实验", "安慰剂", "事件研究", "did", "双重差分",
      "时间顺序", "滞后"
    ],
    associationWords: [
      "事件", "时间窗", "时间窗口", "主体", "账号", "传播链", "转发链", "嵌套",
      "匹配", "连接", "节点", "层级", "同一", "面板", "序列", "帖子"
    ],
    bigData: ["大数据", "海量数据", "全网数据", "全量数据", "百万条", "千万条"],
    advancedMethods: [
      "bert", "roberta", "lda", "sem", "结构方程", "did", "双重差分", "abm",
      "网络分析", "事件研究", "机器学习", "深度学习"
    ],
    methodLink: [
      "用于", "因为", "适用于", "对应", "检验", "分析", "预测", "分类", "估计",
      "因变量", "自变量", "计数", "类别", "嵌套", "层级"
    ],
    statistical: [
      "描述统计", "缺失值", "异常值", "共线性", "vif", "异方差", "稳健标准误",
      "效应量", "置信区间", "分布", "标准化", "聚类标准误"
    ],
    socialResearch: [
      "抽样", "信度", "效度", "编码表", "编码规则", "例句", "排除标准",
      "kappa", "krippendorff", "alpha", "伦理", "匿名", "一致性"
    ],
    econometrics: [
      "内生性", "遗漏变量", "反向因果", "选择偏差", "固定效应", "聚类稳健",
      "平行趋势", "安慰剂", "工具变量", "时间顺序", "因果边界", "滞后"
    ],
    robustness: [
      "替代变量", "替代模型", "替代样本", "敏感性", "稳健性", "子样本",
      "不同时间窗", "安慰剂", "交叉验证", "准确率", "f1", "一致性", "kappa",
      "krippendorff", "置信区间"
    ],
    sourceBasis: [
      "因为", "依据", "选择", "覆盖", "代表", "适合", "集中", "主要", "节点",
      "官方", "媒体账号", "用户", "政策"
    ],
    scrapePlatform: ["微博", "抖音", "小红书", "公众号", "微信", "b站", "知乎", "平台", "数据库"],
    scrapeKeyword: ["关键词", "检索词", "主题词", "政策名称", "话题", "标签"],
    scrapeAccount: ["账号", "发布主体", "媒体", "官方", "用户"],
    scrapeTime: ["时间窗", "窗口", "日期", "发布前", "发布后", "年", "月", "日"],
    scrapeFields: ["字段", "文本", "时间", "点赞", "评论", "转发", "账号类型", "层级", "链接"],
    scrapeExclude: ["排除", "剔除", "去重", "无关", "广告", "重复", "缺失", "不可识别"],
    evidenceReceiver: [
      "问卷", "实验", "访谈", "海外用户", "受众评论", "用户评论", "弹幕", "搜索",
      "点击", "采纳", "行为", "追踪", "接受端", "互动", "转发"
    ],
    contentOnly: ["新闻正文", "报道正文", "政策文本", "发布端内容", "新闻文本", "标题", "导语"],
    effectObjects: ["传播效果", "说服效果", "公众态度", "社会认知", "认知变化", "行为改变", "接受效果"],
    proxyClaims: [
      "点赞代表认同", "点赞量代表认同", "点赞即认同",
      "评论量代表参与", "评论量即参与",
      "转发量代表说服", "转发量即说服", "转发代表说服"
    ],
    boundaryWords: [
      "评论区表达", "不代表总体", "不直接推断", "不能证明", "相关", "关联",
      "限于", "仅讨论", "结论边界", "表达性参与", "互动表现"
    ]
  },
  theoryChains: [
    {
      name: "认知—态度—行为",
      triggers: ["认知", "态度", "行为", "信息接触", "说服"],
      chain: "信息接触 → 认知变化 → 态度形成 → 行为表达"
    },
    {
      name: "议程设置",
      triggers: ["议程", "显著性", "媒体关注", "讨论强度"],
      chain: "媒体关注度 → 公众议题显著性 → 讨论强度"
    },
    {
      name: "框架理论",
      triggers: ["框架", "责任归因", "问题定义", "归因"],
      chain: "框架呈现 → 问题定义 / 责任归因 → 态度或行动倾向"
    },
    {
      name: "使用与满足",
      triggers: ["使用动机", "满足", "持续使用", "媒介使用"],
      chain: "使用动机 → 媒介使用 → 满足获得 → 持续使用"
    },
    {
      name: "创新扩散",
      triggers: ["创新扩散", "采纳", "感知有用性", "感知风险"],
      chain: "信息接触 → 感知有用性 / 感知风险 → 采纳意愿 → 采纳行为"
    },
    {
      name: "社会认同",
      triggers: ["社会认同", "身份认同", "群体线索", "群体互动"],
      chain: "群体线索 → 身份认同 → 态度表达 / 群体互动"
    },
    {
      name: "沉默的螺旋",
      triggers: ["沉默的螺旋", "意见气候", "表达意愿", "公开表达"],
      chain: "意见气候感知 → 表达意愿 → 公开表达行为"
    },
    {
      name: "平台化传播",
      triggers: ["平台规则", "算法", "可见性", "推荐机制", "内容分发"],
      chain: "平台规则 / 可见性机制 → 内容分发 → 互动反馈 → 传播结果"
    },
    {
      name: "国际传播",
      triggers: ["国际传播", "跨文化", "海外用户", "再传播", "翻译"],
      chain: "发布端内容 → 跨文化转译 → 接受端理解 / 互动 / 再传播"
    }
  ],
  objectDatabaseRules: [
    {
      object: ["媒体报道框架", "报道框架", "新闻框架"],
      data: ["新闻正文", "标题", "导语", "报道文本", "媒体账号", "新闻"],
      suggestion: "媒体报道框架应落在新闻正文、标题、导语或媒体账号内容上。"
    },
    {
      object: ["公众态度表达", "态度表达", "责任归因表达", "意见表达"],
      data: ["评论", "弹幕", "转发语", "问卷", "访谈"],
      suggestion: "态度表达需要评论、弹幕、转发语或问卷；平台表达不能外推为总体公众态度。"
    },
    {
      object: ["传播扩散", "信息扩散", "传播网络"],
      data: ["转发链", "互动网络", "发布时间序列", "传播链", "节点", "边"],
      suggestion: "传播扩散需要转发链、互动网络或发布时间序列，而非只有内容文本。"
    },
    {
      object: ["平台推荐机制", "算法推荐", "推荐机制"],
      data: ["曝光", "排序", "推荐位", "流量分配", "审计实验"],
      suggestion: "平台推荐机制通常需要曝光、排序、推荐位、流量分配或审计实验数据；普通公开内容不足。"
    },
    {
      object: ["国际传播效果", "跨文化传播效果"],
      data: ["海外用户", "海外评论", "播放", "互动", "搜索", "媒体引用", "接受端"],
      suggestion: "国际传播效果应包含海外接受端的理解、互动、搜索、引用或再传播证据。"
    },
    {
      object: ["议题演化", "话题演化", "议程演化"],
      data: ["连续时间", "时间序列", "事件节点", "主题变化", "时间窗"],
      suggestion: "议题演化需要连续时间数据、事件节点与可比较的主题变化。"
    },
    {
      object: ["政策传播"],
      data: ["政策文件", "发布帖", "评论", "事件窗口", "平台比较", "政策"],
      suggestion: "政策传播可连接政策文件、发布帖、评论链、事件窗口与平台比较。"
    }
  ],
  researchTools: [
    "编码表", "变量定义", "编码规则", "例句", "排除标准", "抓取方案", "数据清洗",
    "分类模型", "训练集", "验证集", "准确率", "f1", "信度", "kappa",
    "krippendorff", "模型公式", "控制变量", "固定效应", "稳健性", "伦理"
  ]
};

const LITERATURE_ANCHOR_LIBRARY = {
  framingAttribution: {
    name: "框架理论与责任归因",
    keywords: ["框架", "责任归因", "问题定义", "因果解释", "道德评价", "处理建议"],
    suitableObjects: ["新闻报道", "政策话语", "媒体内容", "评论归因", "议题框架"],
    suitableVariables: ["框架类型", "责任归因类型", "发布主体", "问题具体度", "态度表达"],
    suitableMethods: ["内容分析", "多项 Logit", "实验", "文本分类", "框架编码"],
    warnings: ["框架不能只靠关键词命名", "内容框架不能直接证明受众效果"]
  },
  agendaSetting: {
    name: "议程设置与议题显著性",
    keywords: ["议程设置", "议题显著性", "媒体关注", "注意力", "议题转移", "议程融合"],
    suitableObjects: ["媒体议程", "公众议程", "平台热榜", "议题注意力", "跨媒体议程"],
    suitableVariables: ["报道数量", "议题排序", "搜索指数", "讨论强度", "时间滞后"],
    suitableMethods: ["时间序列", "交叉滞后", "VAR", "事件研究", "面板模型"],
    warnings: ["报道量不等于公众显著性", "需要明确时间顺序与议程层级"]
  },
  communicationEffects: {
    name: "传播效果与认知—态度—行为",
    keywords: ["传播效果", "认知", "态度", "行为", "说服", "信息接触", "采纳意愿"],
    suitableObjects: ["受众认知", "态度形成", "行为意向", "实际行为", "信息接触"],
    suitableVariables: ["信息接触", "认知变化", "态度", "行为意向", "行为结果"],
    suitableMethods: ["问卷", "实验", "追踪调查", "结构方程", "面板模型"],
    warnings: ["内容数据不能直接证明传播效果", "态度与行为需要接受端测量"]
  },
  usesGratifications: {
    name: "使用与满足",
    keywords: ["使用与满足", "使用动机", "满足获得", "持续使用", "媒介使用", "需求"],
    suitableObjects: ["媒介使用者", "平台使用", "内容消费", "持续使用", "用户动机"],
    suitableVariables: ["使用动机", "使用强度", "满足获得", "持续使用意愿", "用户特征"],
    suitableMethods: ["问卷", "因子分析", "结构方程", "潜类分析", "访谈辅助"],
    warnings: ["平台行为日志不能自动还原使用动机", "横截面数据难以确认动机先于使用"]
  },
  diffusionInnovation: {
    name: "创新扩散",
    keywords: ["创新扩散", "采纳", "感知有用性", "感知风险", "早期采用者", "扩散阶段"],
    suitableObjects: ["新技术采纳", "健康创新", "平台功能", "政策创新", "扩散网络"],
    suitableVariables: ["信息接触", "感知有用性", "感知风险", "采纳意愿", "采纳行为"],
    suitableMethods: ["问卷", "事件史分析", "生存分析", "网络扩散", "面板模型"],
    warnings: ["采纳意愿不能替代实际采纳", "扩散研究需要时间和网络结构"]
  },
  platformVisibility: {
    name: "平台化传播与可见性机制",
    keywords: ["平台化", "可见性", "算法推荐", "平台规则", "内容分发", "排序", "流量分配"],
    suitableObjects: ["平台治理", "算法可见性", "内容分发", "创作者劳动", "平台权力"],
    suitableVariables: ["推荐位置", "曝光量", "排序", "账号特征", "互动反馈", "平台规则"],
    suitableMethods: ["平台审计", "数字踪迹分析", "固定效应", "网络分析", "现场实验"],
    warnings: ["普通公开数据通常无法观察推荐机制", "互动量不能直接等同曝光或算法偏好"]
  },
  computationalClassification: {
    name: "计算传播文本分类",
    keywords: ["文本分类", "bert", "roberta", "机器学习", "训练集", "验证集", "f1", "人工编码"],
    suitableObjects: ["大规模文本", "框架识别", "立场识别", "情绪分类", "主题分类"],
    suitableVariables: ["人工标签", "类别概率", "分类结果", "文本特征", "模型置信度"],
    suitableMethods: ["人工编码", "BERT", "RoBERTa", "交叉验证", "误差分析"],
    warnings: ["模型性能不能替代理论效度", "必须报告训练集、验证集、F1 与人工编码一致性"]
  },
  socialParticipation: {
    name: "社交媒体公共参与",
    keywords: ["公共参与", "评论", "互动", "转发", "表达性参与", "数字参与", "公共讨论"],
    suitableObjects: ["评论区表达", "线上讨论", "互动网络", "表达性参与", "公共话语"],
    suitableVariables: ["评论类型", "回复层级", "互动量", "讨论质量", "参与角色"],
    suitableMethods: ["内容分析", "负二项回归", "多层模型", "网络分析", "序列分析"],
    warnings: ["评论量不能直接等同公共参与质量", "平台用户不能代表总体公众"]
  },
  internationalReception: {
    name: "国际传播与跨文化接受",
    keywords: ["国际传播", "跨文化", "海外用户", "文化距离", "转译", "接受端", "再传播"],
    suitableObjects: ["海外受众", "多语种内容", "跨文化理解", "国际媒体引用", "再传播"],
    suitableVariables: ["转译框架", "文化距离", "理解类型", "海外互动", "媒体引用"],
    suitableMethods: ["跨语种内容分析", "多层模型", "比较研究", "网络扩散", "问卷实验"],
    warnings: ["发布量与播放量不足以证明国际传播效果", "需要接受端理解或行为证据"]
  },
  mediaEconomics: {
    name: "媒介经济与平台商业模式",
    keywords: ["媒介经济", "商业模式", "平台市场", "广告", "订阅", "注意力经济", "双边市场"],
    suitableObjects: ["媒体组织", "平台企业", "广告市场", "订阅用户", "内容产业"],
    suitableVariables: ["收入结构", "用户规模", "广告价格", "订阅率", "市场集中度", "网络效应"],
    suitableMethods: ["面板回归", "DID", "事件研究", "产业比较", "结构模型"],
    warnings: ["宏观经营结果不能由内容热度单独解释", "因果分析需处理市场选择与反向因果"]
  }
};

const EXAMPLE_RESEARCH_PLAN = {
  title: "从生育倡导到责任分配：生育支持政策评论区的归因框架与公共参与研究",
  targetJournal: "CSSCI 新闻传播学期刊",
  background: "2024—2025 年生育支持政策密集发布，但政策倡导与个体生活经验之间存在明显张力。既有研究较多分析政策文本与宏观态度，较少比较不同发布主体、不同平台话语如何连接评论区的责任归因表达与互动行为。本研究关注政策传播中责任被归于国家、市场、家庭还是个人，以及经验叙事如何使抽象政策问题具体化。",
  researchQuestions: "RQ1：不同发布主体与政策话语具体度对应何种责任归因表达？\nRQ2：评论中的经验叙事与责任归因类型、互动量之间存在何种关联？\nH1：包含经验叙事的评论更可能出现制度责任归因，并获得更高互动量。",
  theory: "以框架理论和责任归因研究为基础。发布端政策框架提供问题定义与责任线索，评论者的经验叙事进一步将抽象政策具体化，可能关联责任归因表达与表达性公共参与。理论链条为：框架呈现与经验线索 → 问题具体化 → 责任归因表达 / 互动反馈。",
  literature: "拟借鉴框架理论、政策传播、责任归因与数字公共参与相关 CSSCI/SSCI 研究范式；目前仅形成文献方向，尚需补充具体作者、年份、论文与期刊。",
  researchObject: "生育支持政策发布后社交媒体评论区中的责任归因表达与互动行为。",
  unitOfAnalysis: "单条评论，嵌套于政策发布帖，发布帖嵌套于平台与发布主体。",
  dataSource: "微博、抖音、微信公众号中围绕 2024 年和 2025 年生育支持政策文件发布节点的政策相关原帖及评论。选择三类平台是为了覆盖公开讨论、短视频互动与机构化发布场景，并以官方政策发布日期建立可比事件节点。",
  scrapingPlan: "以政策文件发布日期为事件节点，设置发布前后 14 天时间窗口。使用政策名称、文件标题及核心关键词检索，抓取官方账号、媒体账号、公共讨论账号发布的政策相关原帖及评论。记录平台、账号类型、发布时间、评论文本、点赞量、回复量、评论层级、原帖链接等字段。排除广告、无关评论、重复文本和不可识别文本，并保留抓取日志。",
  timeWindow: "以每项政策文件发布日期为事件节点，设置发布前后 14 天窗口；对替代窗口进行敏感性比较。",
  samplingRules: "纳入可核验的官方、媒体与公共讨论账号原帖及其一级、二级评论；排除广告、重复、无关、纯表情和不可识别文本。跨平台不合并用户身份；按政策节点与平台分层抽样人工编码。",
  independentVariables: "政策话语具体度、发布主体类型、评论中的经验叙事。话语具体度与经验叙事将依据框架理论和叙事说服相关研究建立编码定义、正反例与取值规则。",
  dependentVariables: "责任归因类型、评论互动量、回复层级。责任归因编码为国家、市场、家庭、个人及混合类型；互动量使用点赞与回复的计数指标，但只解释为平台可见互动，不直接解释为认同或说服。",
  mechanismVariables: "经验叙事可能通过增强问题具体化程度，关联责任归因表达和表达性公共参与。问题具体化将通过人工编码测量；机制分析保持相关性表述，并检验经验叙事—具体化—归因表达的链条。",
  controlVariables: "平台、发布时间、账号粉丝量、原帖互动量、评论长度、情绪倾向、政策文件类型，并说明变量层级与选择依据。",
  methods: "人工编码构建训练集，使用中文 RoBERTa 进行责任归因和经验叙事分类。使用多项 Logit 分析责任归因类型，使用负二项回归分析互动量；评论嵌套于帖子，采用帖子层聚类稳健标准误，并加入平台固定效应和时间固定效应。模型用于估计变量关联，不将观察性结果表述为因果效应。",
  robustness: "使用替代时间窗、替代因变量、替代模型和人工编码子样本进行稳健性检验，并进行平台子样本和政策节点敏感性分析。",
  ethics: "仅采集公开可见内容，遵守平台规则；删除用户昵称与可识别信息，不展示可反向检索的完整评论，限制原始数据访问并说明保存期限。",
  expectedConclusion: "政策传播中的经验叙事可能与公众对生育责任的归因表达相关，并对应更高的平台互动，但本文只讨论特定政策节点与评论区中的表达，不直接推断总体公众态度，也不把点赞或回复解释为认同与说服。"
};

const A_GRADE_PLAN_OVERRIDES = {
  literature: "文献锚定包括：McCombs 与 Shaw（1972）议程设置研究；Entman（1993）框架研究；de Vreese（2005）框架过程研究；责任归因、政策传播与数字参与相关 CSSCI 期刊论文（2019—2025）及 SSCI Journal of Communication、New Media & Society 研究。将逐篇核验作者、年份、题目、期刊与 DOI，并明确借鉴的问题意识、变量定义、编码范式和模型设定。相较既有研究，本项目检验经验叙事在政策框架与责任归因表达之间的边界机制。",
  methods: "先进行描述统计并报告变量分布、缺失值、异常值、效应量与置信区间。制定编码表、变量定义、编码规则、正反例和排除标准，双人独立编码并报告 Kappa、Krippendorff Alpha、信度与测量效度。分层抽样构建训练集、验证集，报告准确率、F1 与混淆矩阵。多项 Logit 对应类别因变量，负二项回归对应过度离散计数因变量；写明模型公式、link function 与拟合诊断。评论嵌套于帖子，采用帖子层聚类稳健标准误、平台固定效应和时间固定效应，讨论共线性、异方差、遗漏变量、反向因果、选择偏差与结论边界。",
  robustness: "采用替代变量、替代模型、替代样本、不同时间窗、人工编码子样本、平台子样本和政策节点敏感性分析；报告 VIF、聚类稳健标准误、模型拟合诊断、Kappa、Krippendorff Alpha、准确率、F1、置信区间与效应量。通过预注册式风险清单区分稳健关联和无法识别的因果解释。",
  samplingRules: "依据政策节点、平台和发布主体分层抽样；记录样本框、纳入概率、缺失与不可见评论。纳入可核验的官方、媒体及公共讨论账号原帖与评论，排除广告、重复、无关、纯表情及不可识别文本。对样本代表性、平台可见性偏差和删除机制进行敏感性分析。",
  expectedConclusion: "在所观察的政策节点、平台与可见评论样本内，经验叙事、问题具体化与责任归因表达之间存在稳定关联。本文不把评论区表达外推为总体公众态度，不把点赞或回复等同认同与说服，也不把观察性关联写成因果效应。"
};

const TEST_CASES = [
  {
    id: "case-a1",
    name: "A1 · 政策归因框架（完整高质量设计）",
    expectedGrade: "A",
    plan: Object.assign({ diagnosisMode: "full" }, EXAMPLE_RESEARCH_PLAN, A_GRADE_PLAN_OVERRIDES)
  },
  {
    id: "case-a2",
    name: "A2 · 国际传播接受效果（多源证据）",
    expectedGrade: "A",
    plan: Object.assign({}, EXAMPLE_RESEARCH_PLAN, A_GRADE_PLAN_OVERRIDES, {
      diagnosisMode: "full",
      title: "跨文化转译如何关联国际传播接受：多语种视频框架、海外评论与再传播研究",
      background: "国际传播研究常以发布量或播放量替代真实接受，但发布端可见度、跨文化理解与再传播并非同一层结果。本研究比较同一公共事件中不同转译框架如何对应海外用户理解、互动与再传播，并检验文化距离的边界作用。",
      researchQuestions: "RQ1：同一事件的不同跨文化转译框架与海外用户理解类型有何关联？\nRQ2：理解类型是否对应评论互动和再传播行为？\nRQ3：文化距离如何调节上述关联？",
      theory: "以国际传播、框架理论与文化接近性研究为基础。理论链条为：发布端内容 → 跨文化转译框架 → 接受端理解 / 互动 → 再传播；文化距离构成边界条件。",
      researchObject: "同一国际公共事件中的国际传播效果，包括海外用户理解表达、互动反馈与再传播行为。",
      dataSource: "围绕同一事件连接 YouTube、X 与海外新闻媒体的多语种发布内容、海外用户评论、播放互动、搜索趋势、媒体引用与公开转发链，所有数据通过事件 ID、内容链接和发布时间序列对应。",
      scrapingPlan: "以统一事件 ID、官方英文名称与多语种关键词检索，设置事件前后 30 天窗口；抓取发布端标题、字幕、画面框架、账号、时间，以及接受端评论、互动、引用、转发链和用户语言。记录内容 ID、父节点、平台、主体与时间字段，排除机器人、广告、重复及无关内容。",
      timeWindow: "围绕同一国际公共事件设置前后 30 天窗口，按事件阶段划分发布、扩散与再传播期。",
      independentVariables: "跨文化转译框架、发布主体类型、文化接近性线索；均依据国际传播与框架研究建立变量定义、编码规则和测量效度检验。",
      dependentVariables: "海外用户理解类型、互动计数、媒体引用与公开再传播行为；不同结果分别对应内容接受、互动反馈与扩散层级。",
      mechanismVariables: "跨文化可理解性作为机制变量，连接转译框架与接受端理解；文化距离作为调节变量。",
      controlVariables: "平台、语言、账号规模、发布时间、内容长度、事件阶段、国家地区与基线关注度。"
    })
  },
  {
    id: "case-b1",
    name: "B1 · 生育政策评论区（内置基准案例）",
    expectedGrade: "B",
    plan: Object.assign({ diagnosisMode: "full" }, EXAMPLE_RESEARCH_PLAN)
  },
  {
    id: "case-b2",
    name: "B2 · 短视频健康框架（可写但需补强）",
    expectedGrade: "B",
    plan: Object.assign({}, EXAMPLE_RESEARCH_PLAN, {
      diagnosisMode: "full",
      title: "短视频健康辟谣的证据框架与评论区纠错表达研究",
      background: "健康辟谣视频在证据呈现、发布主体与评论区纠错之间存在张力。新闻传播学与健康传播研究多讨论内容准确性，较少比较短视频媒介框架、受众评论表达和互动反馈如何连接，也尚不清楚平台差异是否改变纠错话语。",
      researchQuestions: "RQ1：不同证据框架对应何种评论区纠错表达？\nRQ2：发布主体类型是否关联评论互动量？",
      theory: "以框架理论、信息可信度与纠错传播研究为基础。理论链条为：证据框架和权威来源线索 → 感知可信度 → 评论区纠错态度表达与互动反馈；平台可见性构成可能的边界条件。",
      literature: "拟借鉴健康传播、框架理论和网络纠错相关 CSSCI/SSCI 研究，尚需补充完整作者、年份与期刊清单。",
      researchObject: "健康辟谣短视频中的证据框架及其评论区纠错态度表达。",
      dataSource: "选择抖音与 B 站，是因为两平台集中呈现短视频健康辟谣及公开受众反馈。数据包括同一批健康谣言主题的辟谣视频、账号信息与公开评论，并以共同谣言事件、内容主题和发布时间窗口对应。",
      scrapingPlan: "按健康谣言主题、账号与关键词检索，设置发布后 14 天窗口，记录视频文本、主体、时间、评论、点赞、回复等字段，排除广告、重复和无关内容。",
      independentVariables: "证据框架、发布主体类型与权威来源线索。依据框架理论和信息可信度研究制定定义、取值、编码规则与正反例，并区分视频内容层和账号主体层。",
      dependentVariables: "评论区纠错态度表达类型、回复层级与可见互动量。纠错表达通过人工编码分类，互动量作为平台可见计数指标，不外推总体健康态度或真实行为改变。",
      mechanismVariables: "感知可信度是拟讨论机制，连接证据框架和纠错态度表达；当前主要通过评论文本中的可信度线索间接观察，因此需要降低机制结论强度。",
      methods: "先人工编码构建训练集，使用文本分类识别纠错表达并报告准确率与 F1；使用多项 Logit 分析表达类型，负二项回归分析互动量。评论嵌套于视频，采用视频层聚类稳健标准误，控制平台、发布时间、账号规模、视频长度和原帖互动量，模型只估计观察性关联。",
      robustness: "替代时间窗、人工编码子样本与替代计数模型。",
      expectedConclusion: "证据框架与评论区纠错表达存在关联，结论仅限于可见评论。"
    })
  },
  {
    id: "case-c1",
    name: "C1 · 无文献锚定的政策传播设计",
    expectedGrade: "C",
    plan: Object.assign({}, EXAMPLE_RESEARCH_PLAN, {
      diagnosisMode: "full",
      literature: ""
    })
  },
  {
    id: "case-c2",
    name: "C2 · 因果语言越界的评论研究",
    expectedGrade: "C",
    plan: Object.assign({}, EXAMPLE_RESEARCH_PLAN, {
      diagnosisMode: "full",
      researchQuestions: "H1：政策话语具体度导致公众生育态度改善。\nH2：经验叙事显著提升公众政策认同。",
      methods: "抓取评论后进行情感分类，并使用普通 OLS 回归检验变量关系。",
      robustness: "更换情感词典和回归模型。",
      expectedConclusion: "政策话语具体度导致公众生育态度提升，经验叙事促进政策认同。"
    })
  },
  {
    id: "case-d1",
    name: "D1 · 数据来源与抓取规则缺失",
    expectedGrade: "D",
    plan: Object.assign({}, EXAMPLE_RESEARCH_PLAN, {
      diagnosisMode: "full",
      dataSource: "",
      scrapingPlan: "",
      timeWindow: "",
      samplingRules: ""
    })
  },
  {
    id: "case-d2",
    name: "D2 · 核心变量无法操作化",
    expectedGrade: "D",
    plan: Object.assign({}, EXAMPLE_RESEARCH_PLAN, {
      diagnosisMode: "full",
      independentVariables: "",
      dependentVariables: "",
      mechanismVariables: "",
      methods: "计划使用 BERT 和结构方程模型，但尚未确定变量和测量方式。",
      robustness: ""
    })
  },
  {
    id: "case-e1",
    name: "E1 · 只有标题的选题想法",
    expectedGrade: "E",
    plan: {
      diagnosisMode: "full",
      title: "大数据时代新媒体对社会的影响研究",
      background: "新媒体很重要，值得研究。",
      researchQuestions: "新媒体有什么影响？",
      researchObject: "社会"
    }
  },
  {
    id: "case-e2",
    name: "E2 · 数据拼接与概念崩塌",
    expectedGrade: "E",
    plan: {
      diagnosisMode: "full",
      title: "使用千万条全网数据预测经济增长",
      targetJournal: "顶级期刊",
      background: "计划把多个平台海量数据放在一起寻找规律。",
      researchQuestions: "网络数据是否导致经济增长？",
      theory: "",
      literature: "",
      researchObject: "国家经济增长",
      unitOfAnalysis: "",
      dataSource: "微博评论、短视频点赞、新闻标题和随机下载的宏观数据。",
      scrapingPlan: "抓取全网数据。",
      independentVariables: "平台热度",
      dependentVariables: "经济增长和公众认同",
      mechanismVariables: "",
      methods: "使用 BERT、LDA、SEM、DID 和 ABM，方法越多越可靠。",
      expectedConclusion: "网络热度导致国家经济增长并证明公众认同。"
    }
  }
];

const CALIBRATION_CASE_METADATA = {
  "case-a1": {
    caseType: "成熟方案",
    expectedReason: "问题、数据、变量、方法和文献链条完整，未触发硬性降级。"
  },
  "case-a2": {
    caseType: "成熟方案",
    expectedReason: "包含发布端与接受端多源证据，国际传播效果边界清楚。"
  },
  "case-b1": {
    caseType: "文献锚定薄弱",
    expectedReason: "研究设计可执行，但具体 CSSCI/SSCI 文献、信效度和样本边界仍需补强。"
  },
  "case-b2": {
    caseType: "设计不完整",
    expectedReason: "问题—数据基本对应，但机制测量、文献和模型诊断尚不充分。"
  },
  "case-c1": {
    caseType: "文献锚定薄弱",
    expectedReason: "没有任何文献锚定，按硬性规则最高 C。"
  },
  "case-c2": {
    caseType: "方法越界",
    expectedReason: "观察性评论数据使用因果语言，缺少可信因果识别，最高 C。"
  },
  "case-d1": {
    caseType: "数据不匹配",
    expectedReason: "数据来源、抓取规则、时间窗与样本规则缺失，最高 D。"
  },
  "case-d2": {
    caseType: "设计不完整",
    expectedReason: "自变量、因变量和机制变量无法操作化，复杂方法没有研究对象，最高 D。"
  },
  "case-e1": {
    caseType: "概念包装",
    expectedReason: "只有宽泛标题和口号式问题，缺少可观察对象、变量、数据与方法。"
  },
  "case-e2": {
    caseType: "概念包装",
    expectedReason: "跨层数据强行拼接、方法堆砌且核心概念崩塌，原始设计基本不可写。"
  }
};

const CALIBRATION_CASES = TEST_CASES.map(function (testCase) {
  const metadata = CALIBRATION_CASE_METADATA[testCase.id];
  return {
    id: testCase.id,
    title: testCase.name,
    expectedGrade: testCase.expectedGrade,
    expectedReason: metadata.expectedReason,
    inputData: testCase.plan,
    caseType: metadata.caseType
  };
});

const REAL_CASE_JSON_TEMPLATE = {
  id: "real-plan-001",
  title: "真实研究计划标题",
  caseType: "真实研究计划",
  tags: ["可修补", "文献锚定薄弱"],
  status: "已标注",
  expectedGrade: "B",
  expectedReason: "对象—数据基本对应，但文献与稳健性仍需补强。",
  inputData: Object.assign({}, EXAMPLE_RESEARCH_PLAN, { diagnosisMode: "full" }),
  humanReview: {
    reviewerGrade: "B",
    reviewerReason: "人工复核认为方案可继续，但需收紧结论边界。",
    finalDecision: "继续",
    correctionNotes: "补充真实 CSSCI/SSCI 文献、编码信度与样本代表性说明。",
    ruleAdjustmentNeeded: false
  },
  notes: "请删除示例内容并替换为已脱敏的真实研究计划。"
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function joinFields(input, fields) {
  return fields.map(function (field) { return normalizeText(input[field]); }).join(" ");
}

function hasAny(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some(function (keyword) { return normalized.includes(normalizeText(keyword)); });
}

function countGroups(text, groups) {
  return groups.reduce(function (count, keywords) {
    return count + (hasAny(text, keywords) ? 1 : 0);
  }, 0);
}

function uniqueMatches(text, keywords) {
  return keywords.filter(function (keyword) {
    return normalizeText(text).includes(normalizeText(keyword));
  }).length;
}

function clampScore(score) {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function scoreByLength(text, thresholds) {
  const length = normalizeText(text).length;
  if (!length) return 1;
  if (length >= thresholds[3]) return 5;
  if (length >= thresholds[2]) return 4;
  if (length >= thresholds[1]) return 3;
  if (length >= thresholds[0]) return 2;
  return 1;
}

function rawGradeFromScore(score) {
  return SCORING_CONFIG.gradeThresholds.find(function (item) {
    return score >= item.min;
  }).grade;
}

function worseGrade(gradeA, gradeB) {
  const order = SCORING_CONFIG.gradeOrder;
  return order[Math.max(order.indexOf(gradeA), order.indexOf(gradeB))];
}

function riskFromScore(score) {
  if (score >= 4) return "低";
  if (score === 3) return "中";
  return "高";
}

function makeDimension(id, score, diagnosis) {
  const config = SCORING_CONFIG.dimensions.find(function (dimension) {
    return dimension.id === id;
  });
  const safeScore = clampScore(score);
  return {
    id: id,
    axis: config.axis,
    name: config.name,
    score: safeScore,
    diagnosis: diagnosis,
    risk: riskFromScore(safeScore)
  };
}

function findTheoryChain(input) {
  const text = joinFields(input, [
    "title", "background", "researchQuestions", "theory",
    "independentVariables", "dependentVariables", "mechanismVariables"
  ]);
  const ranked = SCORING_CONFIG.theoryChains.map(function (item) {
    return {
      name: item.name,
      chain: item.chain,
      hits: uniqueMatches(text, item.triggers)
    };
  }).sort(function (a, b) { return b.hits - a.hits; });
  return ranked[0].hits > 0 ? ranked[0] : null;
}

function inspectObjectDatabaseMatch(input) {
  const objectText = normalizeText(input.researchObject);
  const dataText = joinFields(input, ["dataSource", "scrapingPlan", "timeWindow"]);
  if (!objectText || !dataText) {
    return {
      status: "unknown",
      scoreAdjustment: -1,
      message: "研究对象或数据来源缺失，暂时无法建立对象—数据库对应关系。"
    };
  }

  const relevantRules = SCORING_CONFIG.objectDatabaseRules.filter(function (rule) {
    return hasAny(objectText, rule.object);
  });
  if (!relevantRules.length) {
    return {
      status: "partial",
      scoreAdjustment: 0,
      message: "未命中内置对象类型。请人工确认研究对象是否会在所选数据中留下可观察痕迹。"
    };
  }

  const matchedRule = relevantRules.find(function (rule) {
    return hasAny(dataText, rule.data);
  });
  if (matchedRule) {
    return {
      status: "matched",
      scoreAdjustment: 1,
      message: "对象与数据类型基本对应。" + matchedRule.suggestion
    };
  }
  return {
    status: "mismatch",
    scoreAdjustment: -2,
    message: relevantRules[0].suggestion + " 当前数据尚未提供这一层证据。"
  };
}

function inspectEvidenceConclusion(input) {
  const objectText = normalizeText(input.researchObject);
  const dataText = joinFields(input, ["dataSource", "scrapingPlan"]);
  const conclusionText = joinFields(input, ["researchQuestions", "expectedConclusion"]);
  const claimsEffect = hasAny(objectText + " " + conclusionText, SCORING_CONFIG.keywords.effectObjects);
  const contentOnly = hasAny(dataText, SCORING_CONFIG.keywords.contentOnly);
  const hasReceiverEvidence = hasAny(dataText, SCORING_CONFIG.keywords.evidenceReceiver);
  const hasBoundary = hasAny(conclusionText, SCORING_CONFIG.keywords.boundaryWords);
  const platformExpression = hasAny(dataText, ["微博", "抖音", "小红书", "公众号", "评论"]);
  const generalizedAttitude = hasAny(objectText + " " + conclusionText, ["公众态度", "社会认知", "全民", "总体公众"]);

  if (claimsEffect && contentOnly && !hasReceiverEvidence) {
    return {
      mismatch: true,
      message: "研究声称传播效果，但证据停留在发布端内容层，缺少接受端或行为端证据。"
    };
  }
  if (platformExpression && generalizedAttitude && !hasBoundary) {
    return {
      mismatch: true,
      message: "平台表达被外推为总体公众态度，样本与结论的总体边界不一致。"
    };
  }
  if (hasBoundary) {
    return {
      mismatch: false,
      message: "预期结论已主动限定到可观察表达或关联层，证据边界意识较清楚。"
    };
  }
  return {
    mismatch: false,
    message: "尚未发现明确越界，但应逐条核对每项结论对应的证据层级与总体边界。"
  };
}

function inspectCausalRisk(input) {
  const claimsText = joinFields(input, ["title", "researchQuestions", "expectedConclusion"]);
  const designText = joinFields(input, ["methods", "robustness", "timeWindow"]);
  const usesCausalLanguage = hasAny(claimsText, SCORING_CONFIG.keywords.causalWords);
  const hasCausalDesign = hasAny(designText, SCORING_CONFIG.keywords.causalDesign);
  const statesBoundary = hasAny(claimsText + " " + designText, SCORING_CONFIG.keywords.boundaryWords);
  return {
    risky: usesCausalLanguage && !hasCausalDesign && !statesBoundary,
    usesCausalLanguage: usesCausalLanguage,
    hasCausalDesign: hasCausalDesign,
    message: usesCausalLanguage && !hasCausalDesign
      ? "结论使用影响或效应语言，但当前设计未提供足够的时间顺序、对照或识别策略。"
      : "未发现明显的相关性—因果越界，仍需在写作中保持识别边界。"
  };
}

function inspectProxyClaims(input) {
  const text = joinFields(input, ["dependentVariables", "researchQuestions", "expectedConclusion"]);
  return {
    risky: hasAny(text, SCORING_CONFIG.keywords.proxyClaims),
    message: hasAny(text, SCORING_CONFIG.keywords.proxyClaims)
      ? "点赞、评论或转发被直接解释为认同、参与或说服，代理变量缺少效度论证。"
      : "未发现把平台互动指标直接等同心理或行为结果的明确表述。"
  };
}

function inspectResearchTools(input) {
  const text = joinFields(input, [
    "scrapingPlan", "samplingRules", "independentVariables", "dependentVariables",
    "mechanismVariables", "controlVariables", "methods", "robustness", "ethics"
  ]);
  const found = SCORING_CONFIG.researchTools.filter(function (tool) {
    return normalizeText(text).includes(normalizeText(tool));
  });
  const missing = SCORING_CONFIG.researchTools.filter(function (tool) {
    return !found.includes(tool);
  });
  return {
    found: found,
    missing: missing,
    ratio: found.length / SCORING_CONFIG.researchTools.length
  };
}

function truncateText(text, maxLength) {
  const normalized = String(text || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "未提供";
  return normalized.length > maxLength ? normalized.slice(0, maxLength) + "…" : normalized;
}

function buildConfidence(input, mode) {
  const modeConfig = SCORING_CONFIG.modes[mode] || SCORING_CONFIG.modes.full;
  const filledFields = modeConfig.relevantFields.filter(function (field) {
    return normalizeText(input[field]).length > 0;
  });
  const substantiveFields = modeConfig.relevantFields.filter(function (field) {
    return normalizeText(input[field]).length >= (field === "title" ? 8 : 24);
  });
  const missingKeyFields = modeConfig.keyFields.filter(function (field) {
    return !normalizeText(input[field]);
  });
  const completeness = filledFields.length / modeConfig.relevantFields.length;
  const substance = substantiveFields.length / modeConfig.relevantFields.length;
  const numericScore = Math.round((completeness * 0.65 + substance * 0.35) * 100);
  let level = "低";
  if (numericScore >= 82 && missingKeyFields.length === 0) {
    level = "高";
  } else if (numericScore >= 52 && missingKeyFields.length <= 2) {
    level = "中";
  }
  const missingLabels = missingKeyFields.map(function (field) {
    return SCORING_CONFIG.fieldLabels[field] || field;
  });
  let reason = "相关字段已填写 " + filledFields.length + "/" + modeConfig.relevantFields.length +
    "，其中 " + substantiveFields.length + " 项达到可诊断的信息量。";
  if (missingLabels.length) {
    reason += " 关键缺失：" + missingLabels.join("、") + "。";
  } else {
    reason += " 关键字段齐全。";
  }
  if (mode === "quick") {
    reason += " 快速模式不审计完整方法与发表价值。";
  }
  return {
    level: level,
    score: numericScore,
    reason: reason,
    filled: filledFields.length,
    total: modeConfig.relevantFields.length,
    missingKeyFields: missingKeyFields
  };
}

function calculateDesignCompleteness(input) {
  const config = SCORING_CONFIG.designCompleteness;
  const items = config.items.map(function (item) {
    const value = normalizeText(input[item.field]);
    let credit = 0;
    let detail = "未提供";
    if (value) {
      credit = value.length >= item.minLength ? 1 : 0.5;
      detail = credit === 1 ? "完整" : "信息偏少";
    }
    if (item.rule === "literature" && value) {
      const citationSignals = uniqueMatches(value, [
        "cssci", "ssci", "作者", "年份", "期刊", "journal", "doi", "20"
      ]);
      credit = value.length >= item.minLength && citationSignals >= 2 ? 1 : 0.5;
      detail = credit === 1 ? "有具体文献线索" : "仅有文献方向";
    }
    if (item.rule === "unit" && value) {
      const hasUnit = hasAny(value, [
        "帖子", "评论", "用户", "账号", "平台", "事件", "传播链", "时间单元"
      ]);
      credit = hasUnit ? (value.length >= item.minLength ? 1 : 0.5) : 0.5;
      detail = hasUnit ? "分析单位可识别" : "层级尚不明确";
    }
    if (item.rule === "scraping" && value) {
      const hits = countGroups(value, [
        SCORING_CONFIG.keywords.scrapePlatform,
        SCORING_CONFIG.keywords.scrapeKeyword,
        SCORING_CONFIG.keywords.scrapeAccount,
        SCORING_CONFIG.keywords.scrapeTime,
        SCORING_CONFIG.keywords.scrapeFields,
        SCORING_CONFIG.keywords.scrapeExclude
      ]);
      credit = hits >= 5 ? 1 : (hits >= 2 ? 0.5 : 0);
      detail = "覆盖抓取要素 " + hits + "/6";
    }
    if (item.rule === "boundary" && value) {
      const hasBoundary = hasAny(value, SCORING_CONFIG.keywords.boundaryWords);
      credit = hasBoundary && value.length >= item.minLength ? 1 : 0.5;
      detail = hasBoundary ? "已声明结论边界" : "未明确限制外推或因果";
    }
    return {
      id: item.id,
      label: item.label,
      field: item.field,
      credit: credit,
      status: credit === 1 ? "完整" : (credit === 0.5 ? "部分" : "缺失"),
      detail: detail
    };
  });
  const score = Math.round(items.reduce(function (sum, item) {
    return sum + item.credit;
  }, 0) / items.length * 100);
  const threshold = config.thresholds.find(function (item) {
    return score >= item.min;
  });
  const missing = items.filter(function (item) { return item.credit === 0; });
  const partial = items.filter(function (item) { return item.credit === 0.5; });
  return {
    score: score,
    level: threshold.label,
    items: items,
    missing: missing,
    partial: partial,
    isInsufficient: score < 40,
    warning: score < 40 ? config.insufficientWarning : "",
    explanation: "完整 " + (items.length - missing.length - partial.length) + "/" + items.length +
      "，部分 " + partial.length + "，缺失 " + missing.length + "。"
  };
}

function matchLiteratureAnchors(input) {
  const theoryText = joinFields(input, [
    "title", "theory", "literature", "researchObject",
    "independentVariables", "dependentVariables", "mechanismVariables"
  ]);
  const objectText = joinFields(input, ["researchObject", "dataSource"]);
  const variableText = joinFields(input, [
    "independentVariables", "dependentVariables", "mechanismVariables", "controlVariables"
  ]);
  const methodText = normalizeText(input.methods);
  const matches = Object.keys(LITERATURE_ANCHOR_LIBRARY).map(function (id) {
    const anchor = LITERATURE_ANCHOR_LIBRARY[id];
    const keywordMatches = anchor.keywords.filter(function (keyword) {
      return normalizeText(theoryText).includes(normalizeText(keyword));
    });
    const objectMatches = anchor.suitableObjects.filter(function (keyword) {
      return normalizeText(objectText).includes(normalizeText(keyword));
    });
    const variableMatches = anchor.suitableVariables.filter(function (keyword) {
      return normalizeText(variableText).includes(normalizeText(keyword));
    });
    const methodMatches = anchor.suitableMethods.filter(function (keyword) {
      return normalizeText(methodText).includes(normalizeText(keyword));
    });
    const score = keywordMatches.length * 3 + objectMatches.length * 2 +
      variableMatches.length * 2 + methodMatches.length;
    const gaps = [];
    if (!variableMatches.length) gaps.push("当前变量尚未直接接入该传统的典型变量。");
    if (!methodMatches.length) gaps.push("当前方法尚未体现该传统常用的识别或分析范式。");
    if (normalizeText(input.literature).length < 120) {
      gaps.push("缺少可核验的作者、年份、题目、期刊或 DOI。");
    }
    return {
      id: id,
      name: anchor.name,
      score: score,
      basis: keywordMatches.concat(objectMatches).concat(variableMatches).concat(methodMatches),
      suitableVariables: anchor.suitableVariables,
      suitableMethods: anchor.suitableMethods,
      warnings: anchor.warnings,
      gaps: gaps,
      neededLiteratureTypes: [
        anchor.name + "的经典奠基文献",
        "近五年 CSSCI/SSCI 实证研究",
        "核心变量测量与效度验证文献",
        "与当前数据结构相符的方法论文"
      ]
    };
  }).sort(function (a, b) { return b.score - a.score; });
  const positiveMatches = matches.filter(function (item) { return item.score > 0; });
  const selected = positiveMatches.slice(0, 3);
  return {
    primary: selected[0] || null,
    matches: selected,
    matched: selected.length > 0,
    summary: selected.length
      ? "最接近“" + selected[0].name + "”，依据：" +
        (selected[0].basis.slice(0, 6).join("、") || "研究对象与方法结构") + "。"
      : "未匹配到稳定研究传统；请补充理论名称、文献线索、变量定义与方法依据。",
    disclaimer: "本地文献锚定库只做研究传统匹配，不能替代真实 CSSCI/SSCI 检索与文献核验。"
  };
}

function buildAlignmentMatrix(input, allDimensions, inspections, mode) {
  const getDimension = function (id) {
    return allDimensions.find(function (item) { return item.id === id; });
  };
  const dataText = joinFields(input, ["dataSource", "scrapingPlan", "timeWindow", "samplingRules"]);
  const variableTheoryText = joinFields(input, ["theory", "literature"]);
  const platformKeywords = ["微博", "抖音", "小红书", "公众号", "微信", "b站", "youtube", "x平台", "知乎"];
  const platformCount = uniqueMatches(dataText, platformKeywords);
  const connectionCount = uniqueMatches(dataText, [
    "共同事件", "同一事件", "事件节点", "事件 id", "时间窗", "时间窗口",
    "发布主体", "传播链", "转发链", "内容 id", "帖子 id", "嵌套", "匹配"
  ]);
  const multiDataDisconnected =
    (platformCount >= 2 || hasAny(dataText, SCORING_CONFIG.keywords.bigData)) &&
    connectionCount < 2;
  const attitudeFromComments =
    hasAny(input.researchObject, ["公众态度", "社会认知", "公众认同", "总体态度"]) &&
    hasAny(dataText, ["评论", "弹幕", "转发语"]) &&
    !hasAny(dataText, ["问卷", "实验", "访谈", "追踪"]);
  const effectFromContent =
    hasAny(joinFields(input, ["researchObject", "researchQuestions"]), ["传播效果", "说服效果", "接受效果"]) &&
    hasAny(dataText, SCORING_CONFIG.keywords.contentOnly) &&
    !hasAny(dataText, SCORING_CONFIG.keywords.evidenceReceiver);
  const noVariableTheory =
    !normalizeText(variableTheoryText) ||
    getDimension(8).score <= 2 ||
    getDimension(9).score <= 2 ||
    (normalizeText(input.mechanismVariables) && getDimension(10).score <= 2);

  const rows = [
    {
      element: "研究问题",
      extracted: truncateText(input.researchQuestions, 150),
      counterpart: "方法：" + truncateText(input.methods, 105),
      status: !normalizeText(input.researchQuestions)
        ? "不匹配"
        : (inspections.causal.risky ? "不匹配" : (normalizeText(input.methods) ? "匹配" : "待补"))
    },
    {
      element: "研究对象",
      extracted: truncateText(input.researchObject, 130),
      counterpart: "数据：" + truncateText(input.dataSource, 115),
      status: inspections.objectDatabase.status === "matched"
        ? "匹配"
        : (inspections.objectDatabase.status === "mismatch" ? "不匹配" : "待补")
    },
    {
      element: "数据来源",
      extracted: truncateText(input.dataSource, 150),
      counterpart: "连接规则：" + truncateText(
        joinFields(input, ["timeWindow", "scrapingPlan", "unitOfAnalysis"]), 115
      ),
      status: !normalizeText(input.dataSource)
        ? "不匹配"
        : (multiDataDisconnected ? "不匹配" : (connectionCount >= 2 ? "匹配" : "待补"))
    },
    {
      element: "自变量",
      extracted: truncateText(input.independentVariables, 130),
      counterpart: "理论：" + truncateText(input.theory, 110),
      status: getDimension(8).score >= 4 ? "匹配" : (getDimension(8).score === 3 ? "待补" : "不匹配")
    },
    {
      element: "因变量",
      extracted: truncateText(input.dependentVariables, 130),
      counterpart: "数据/模型：" + truncateText(
        joinFields(input, ["dataSource", "methods"]), 110
      ),
      status: getDimension(9).score >= 4 && !attitudeFromComments && !effectFromContent
        ? "匹配"
        : (getDimension(9).score === 3 ? "待补" : "不匹配")
    },
    {
      element: "机制变量",
      extracted: truncateText(input.mechanismVariables, 130),
      counterpart: inspections.theoryChain
        ? "理论链：" + inspections.theoryChain.name
        : "理论链：未识别",
      status: getDimension(10).score >= 4 ? "匹配" : (getDimension(10).score === 3 ? "待补" : "不匹配")
    },
    {
      element: "研究方法",
      extracted: truncateText(input.methods, 150),
      counterpart: "结果变量：" + truncateText(input.dependentVariables, 105),
      status: mode === "quick" && !normalizeText(input.methods)
        ? "待补"
        : (getDimension(13).score >= 4 ? "匹配" : (getDimension(13).score === 3 ? "待补" : "不匹配"))
    }
  ];

  const risks = [];
  const addRisk = function (code, priority, message) {
    risks.push({ code: code, priority: priority, message: message });
  };
  if (inspections.causal.risky) {
    addRisk("causal-without-identification", "fatal",
      "研究问题使用因果表述，但方法没有提供时间顺序、对照组或其他可信因果识别。");
  }
  if (attitudeFromComments) {
    addRisk("attitude-from-comments", "fatal",
      "研究对象是公众态度，但数据只有平台评论；评论区表达不能代表总体公众态度。");
  }
  if (effectFromContent) {
    addRisk("effect-from-content", "fatal",
      "研究对象是传播效果，但数据只有内容文本，缺少接受端或行为端证据。");
  }
  if (multiDataDisconnected) {
    addRisk("disconnected-multi-data", "major",
      "多平台或海量数据缺少共同事件、时间窗、主体或传播链连接规则，存在数据拼接风险。");
  }
  if (noVariableTheory) {
    addRisk("variables-without-theory", "major",
      "自变量、因变量或机制变量缺少可辨认的传播学理论依据，变量链条尚未成立。");
  }
  return {
    rows: rows,
    risks: risks,
    flags: {
      causalWithoutIdentification: inspections.causal.risky,
      attitudeFromComments: attitudeFromComments,
      effectFromContent: effectFromContent,
      multiDataDisconnected: multiDataDisconnected,
      noVariableTheory: noVariableTheory
    }
  };
}

function evaluateDimensions(input, inspections) {
  const keywords = SCORING_CONFIG.keywords;
  const disciplineText = joinFields(input, ["title", "background", "researchQuestions", "researchObject"]);
  const theoryText = joinFields(input, ["theory", "researchQuestions", "mechanismVariables"]);
  const variableText = joinFields(input, [
    "independentVariables", "dependentVariables", "mechanismVariables", "controlVariables", "methods"
  ]);
  const methodText = joinFields(input, ["methods", "robustness"]);
  const dataAssociationText = joinFields(input, [
    "dataSource", "scrapingPlan", "timeWindow", "samplingRules", "unitOfAnalysis"
  ]);

  const disciplineHits = uniqueMatches(disciplineText, keywords.communicationCore);
  let disciplineScore = disciplineText.length ? 2 : 1;
  if (disciplineHits >= 2) disciplineScore = 3;
  if (disciplineHits >= 4 && normalizeText(input.researchQuestions)) disciplineScore = 4;
  if (disciplineHits >= 7 && normalizeText(input.background).length >= 100) disciplineScore = 5;
  const d1 = makeDimension(1, disciplineScore,
    disciplineScore >= 4
      ? "研究明确落在传播主体、内容、受众、互动或传播效果等学科议题中。"
      : "传播学核心概念与问题边界不足，需说明它改变了我们对哪一类传播过程的理解。");

  let realityScore = scoreByLength(input.background, [35, 80, 150, 260]);
  if (hasAny(input.background, keywords.realityProblem)) realityScore += 1;
  if (!normalizeText(input.researchQuestions)) realityScore -= 1;
  const d2 = makeDimension(2, realityScore,
    realityScore >= 4
      ? "问题意识来自可辨认的现实传播矛盾，并已提出待解释的知识缺口。"
      : "背景更多是在陈述现象；需明确具体矛盾、既有解释缺口与可检验问题。");

  let theoryClarityScore = scoreByLength(input.theory, [25, 70, 140, 230]);
  if (hasAny(theoryText, keywords.theoreticalLogic)) theoryClarityScore += 1;
  if (!normalizeText(input.researchQuestions)) theoryClarityScore -= 1;
  const d3 = makeDimension(3, theoryClarityScore,
    theoryClarityScore >= 4
      ? "理论命题与变量关系基本可辨认，能够形成传播学解释链。"
      : "理论仍偏向名称罗列；应以一句话写清理论预期的变量关系与知识增量。");

  let sourceScore = scoreByLength(input.dataSource, [20, 60, 120, 220]);
  if (hasAny(input.dataSource, keywords.sourceBasis)) sourceScore += 1;
  const d4 = makeDimension(4, sourceScore,
    sourceScore >= 4
      ? "数据来源、场景与选择依据较明确。"
      : "数据来源说明不足；需解释为什么该平台、数据库或事件能够回答研究问题。");

  const scrapeText = joinFields(input, ["scrapingPlan", "timeWindow", "samplingRules"]);
  const scrapeGroups = [
    keywords.scrapePlatform, keywords.scrapeKeyword, keywords.scrapeAccount,
    keywords.scrapeTime, keywords.scrapeFields, keywords.scrapeExclude
  ];
  const scrapeHits = countGroups(scrapeText, scrapeGroups);
  let scrapeScore = !normalizeText(input.scrapingPlan) ? 1 : Math.max(2, Math.min(5, scrapeHits));
  if (normalizeText(input.scrapingPlan).length >= 180 && scrapeHits >= 5) scrapeScore = 5;
  const d5 = makeDimension(5, scrapeScore,
    "抓取方案覆盖 6 类要素中的 " + scrapeHits + " 类（平台、检索词、账号、时间、字段、排除规则）。" +
    (scrapeHits >= 5 ? " 可执行性较强。" : " 需补齐缺失要素与可复现边界。"));

  let objectDataScore = (normalizeText(input.researchObject) && normalizeText(input.dataSource)) ? 3 : 1;
  objectDataScore += inspections.objectDatabase.scoreAdjustment;
  if (inspections.objectDatabase.status === "matched" && normalizeText(input.scrapingPlan).length >= 80) objectDataScore += 1;
  const d6 = makeDimension(6, objectDataScore, inspections.objectDatabase.message);

  const associationHits = uniqueMatches(dataAssociationText, keywords.associationWords);
  let associationScore = !normalizeText(input.dataSource) ? 1 : 2;
  if (associationHits >= 2) associationScore = 3;
  if (associationHits >= 4) associationScore = 4;
  if (associationHits >= 7 && normalizeText(input.unitOfAnalysis)) associationScore = 5;
  if (associationScore === 5 &&
      !hasAny(dataAssociationText, ["唯一标识", "连接键", "记录 id", "帖子 id", "评论 id"])) {
    associationScore = 4;
  }
  if (hasAny(dataAssociationText, keywords.bigData) && associationHits < 2) associationScore = 1;
  const d7 = makeDimension(7, associationScore,
    associationScore >= 4
      ? "数据通过事件、时间、主体或嵌套层级形成了可解释的关联结构。"
      : "数据间连接规则偏弱；请写明事件、主体、时间窗、传播链或层级关系。");

  let ivScore = scoreByLength(input.independentVariables, [18, 55, 115, 200]);
  if (normalizeText(input.theory).length >= 40 && hasAny(input.independentVariables, keywords.theoreticalLogic)) ivScore += 1;
  if (!normalizeText(input.theory)) ivScore = Math.min(ivScore, 2);
  const d8 = makeDimension(8, ivScore,
    ivScore >= 4
      ? "自变量已有理论线索、概念含义或测量方向。"
      : "自变量与传播学理论连接不足；需交代理论来源、层级、取值与作用方向。");

  let dvScore = scoreByLength(input.dependentVariables, [18, 55, 115, 200]);
  if (hasAny(input.dependentVariables, ["认知", "态度", "行为", "表达", "参与", "扩散", "互动", "归因", "效果"])) dvScore += 1;
  if (!normalizeText(input.theory)) dvScore = Math.min(dvScore, 2);
  if (inspections.proxy.risky) dvScore = Math.min(dvScore, 2);
  const d9 = makeDimension(9, dvScore,
    inspections.proxy.risky
      ? inspections.proxy.message
      : (dvScore >= 4
        ? "因变量对应可观察的传播表达、互动、扩散或效果概念，并有初步测量边界。"
        : "因变量的传播学含义或测量效度不足，需避免把平台指标直接等同心理结果。"));

  let mechanismScore = scoreByLength(input.mechanismVariables, [20, 60, 120, 210]);
  if (inspections.theoryChain) mechanismScore += 1;
  if (!normalizeText(input.theory)) mechanismScore = Math.min(mechanismScore, 2);
  const d10 = makeDimension(10, mechanismScore,
    inspections.theoryChain
      ? "当前最接近“" + inspections.theoryChain.name + "”链条：" + inspections.theoryChain.chain + "。需核对每一环是否都有独立测量与时间顺序。"
      : "尚未识别出稳定的传播学机制链条；机制变量不能只是额外相关变量。");

  const operationHits = uniqueMatches(variableText, keywords.operation);
  let operationScore = !normalizeText(input.independentVariables) || !normalizeText(input.dependentVariables) ? 1 : 2;
  if (operationHits >= 2) operationScore = 3;
  if (operationHits >= 4) operationScore = 4;
  if (operationHits >= 7) operationScore = 5;
  if (operationScore === 5 &&
      !hasAny(variableText, ["测量效度", "效度检验", "预测试", "构念效度", "聚合效度"])) {
    operationScore = 4;
  }
  const d11 = makeDimension(11, operationScore,
    operationScore >= 4
      ? "核心概念已出现编码、定义、指标或分类方案，可进一步形成可复核工具。"
      : "概念到变量的转换尚不充分；需补变量定义、取值、编码规则、例句与效度依据。");

  const unitText = normalizeText(input.unitOfAnalysis);
  const unitTypes = ["帖子", "评论", "用户", "账号", "平台", "事件", "传播链", "时间单元"];
  const unitCount = uniqueMatches(unitText, unitTypes);
  let unitScore = unitText ? 3 : 1;
  if (unitCount === 1) unitScore = 4;
  if (unitCount > 1 && hasAny(unitText, ["嵌套", "层级", "归属于", "聚类"])) unitScore = 5;
  if (unitCount > 1 && !hasAny(unitText, ["嵌套", "层级", "归属于", "聚类"])) unitScore = 2;
  const d12 = makeDimension(12, unitScore,
    unitScore >= 4
      ? "分析单位及其层级关系较清楚。"
      : "分析单位缺失或存在跨层混用风险；需明确每条记录代表什么、结论落在哪一层。");

  const advancedCount = uniqueMatches(methodText, keywords.advancedMethods);
  const methodLinkCount = uniqueMatches(methodText, keywords.methodLink);
  let modelScore = scoreByLength(input.methods, [25, 80, 170, 300]);
  if (methodLinkCount >= 2) modelScore += 1;
  if (advancedCount > 0 && methodLinkCount === 0) modelScore = Math.min(modelScore, 2);
  if (modelScore >= 5 && !hasAny(input.methods, ["模型公式", "link function", "残差诊断", "拟合诊断"])) {
    modelScore = 4;
  }
  const d13 = makeDimension(13, modelScore,
    advancedCount > 0 && methodLinkCount === 0
      ? "列出了复杂方法，但没有说明它与研究问题、变量尺度和数据结构的对应关系。"
      : (modelScore >= 4
        ? "模型与分类、类别结果、计数结果或嵌套结构之间已有匹配说明。"
        : "方法名称已有出现，但需补充模型选择依据、公式、估计对象与诊断步骤。"));

  const statHits = uniqueMatches(methodText, keywords.statistical);
  let statScore = !normalizeText(input.methods) ? 1 : 2 + Math.min(3, Math.floor(statHits / 2));
  if (normalizeText(input.methods).length >= 180 && statHits >= 2) statScore += 1;
  const d14 = makeDimension(14, statScore,
    "已覆盖 " + statHits + " 个基础统计检查信号。需系统处理描述统计、尺度、缺失、异常、共线性、异方差、效应量与不确定性。");

  const socialHits = uniqueMatches(joinFields(input, ["methods", "samplingRules", "ethics", "robustness"]), keywords.socialResearch);
  let socialScore = !normalizeText(input.methods) ? 1 : 2 + Math.min(3, Math.floor(socialHits / 2));
  if (!normalizeText(input.ethics)) socialScore -= 1;
  if (socialScore >= 5 &&
      !(hasAny(joinFields(input, ["methods", "robustness"]), ["信度", "kappa", "krippendorff"]) &&
        hasAny(joinFields(input, ["methods", "robustness"]), ["效度", "预测试", "验证"]))) {
    socialScore = 4;
  }
  const d15 = makeDimension(15, socialScore,
    "已覆盖 " + socialHits + " 个社会研究方法信号。重点核对抽样、概念化、操作化、编码信度、测量效度与伦理边界。");

  const econHits = uniqueMatches(methodText + " " + normalizeText(input.expectedConclusion), keywords.econometrics);
  let econScore = !normalizeText(input.methods) ? 1 : 2 + Math.min(3, Math.floor(econHits / 2));
  if (inspections.causal.risky) econScore = Math.min(econScore, 2);
  if (!inspections.causal.usesCausalLanguage && hasAny(methodText, ["相关", "关联", "观察性"])) econScore += 1;
  const d16 = makeDimension(16, econScore,
    inspections.causal.risky
      ? inspections.causal.message
      : "未发现明显因果越界；仍需讨论内生性、遗漏变量、反向因果、选择偏差与标准误层级。");

  const robustnessHits = uniqueMatches(input.robustness, keywords.robustness);
  let robustnessScore = !normalizeText(input.robustness) ? 1 : 2;
  if (robustnessHits >= 2) robustnessScore = 3;
  if (robustnessHits >= 4) robustnessScore = 4;
  if (robustnessHits >= 7) robustnessScore = 5;
  const d17 = makeDimension(17, robustnessScore,
    "稳健性方案包含 " + robustnessHits + " 类检验信号。" +
    (robustnessScore >= 4 ? " 已具备替代测量、模型或样本验证思路。" : " 需补替代变量、替代模型、替代样本或敏感性分析。"));

  const literatureText = normalizeText(input.literature);
  const citationSignals = uniqueMatches(literatureText, ["cssci", "ssci", "期刊", "作者", "年份", "20", "journal", "研究"]);
  let literatureScore = !literatureText ? 1 : 2;
  if (citationSignals >= 2 && literatureText.length >= 80) literatureScore = 3;
  if (citationSignals >= 4 && literatureText.length >= 140) literatureScore = 4;
  if (citationSignals >= 6 && literatureText.length >= 240) literatureScore = 5;
  if (hasAny(literatureText, ["尚需", "拟补充", "尚未", "待补充"])) literatureScore = Math.min(literatureScore, 2);
  const d18 = makeDimension(18, literatureScore,
    literatureScore >= 4
      ? "已有较具体的 CSSCI/SSCI 或经典文献锚点，可继续核验其问题与方法继承关系。"
      : "文献锚定不足；需列出可核验作者、年份、题目、期刊，并说明借鉴的问题意识、变量或方法范式。");

  let incrementScore = 1;
  const targetText = normalizeText(input.targetJournal);
  const incrementText = joinFields(input, ["background", "researchQuestions", "theory", "targetJournal"]);
  if (targetText) incrementScore += 1;
  if (hasAny(incrementText, ["缺口", "贡献", "增量", "拓展", "修正", "机制", "边界"])) incrementScore += 1;
  if (normalizeText(input.researchQuestions).length >= 70 && normalizeText(input.theory).length >= 80) incrementScore += 1;
  if (literatureScore >= 4) incrementScore += 1;
  const d19 = makeDimension(19, incrementScore,
    incrementScore >= 4
      ? "研究已出现理论增量与目标层级适配意识，仍需避免仅换平台、对象或算法。"
      : "创新与期刊适配尚不清楚；应相对既有文献说明新增解释，而非只强调新对象、新平台或新方法。");

  return [
    d1, d2, d3, d4, d5, d6, d7, d8, d9, d10,
    d11, d12, d13, d14, d15, d16, d17, d18, d19
  ];
}

function evaluateHardDowngrades(input, dimensions, inspections, mode) {
  const isFull = mode === "full";
  const triggers = [];
  const dimension = function (id) {
    return dimensions.find(function (item) { return item.id === id; });
  };
  const add = function (rule, cap, message) {
    triggers.push({ rule: rule, cap: cap, message: message });
  };

  if (dimension(1).score <= 2) {
    add(1, "C", "研究问题尚未稳定落入新闻传播学核心问题，最终等级最高 C。");
  }
  if (inspections.evidence.mismatch) {
    add(2, "C", inspections.evidence.message + " 最终等级最高 C。");
  }
  if (inspections.objectDatabase.status === "mismatch") {
    add(3, "C", "研究对象与当前数据库不对应，最终等级最高 C。");
  }
  if (dimension(8).score <= 2 || dimension(9).score <= 2) {
    add(4, "C", "自变量或因变量缺少传播学理论依据，最终等级最高 C。");
  }
  if (isFull && dimension(12).score <= 2) {
    add(5, "C", "分析单位缺失或混乱，最终等级最高 C。");
  }
  if (inspections.causal.risky) {
    add(6, "C", "相关性设计使用因果结论，最终等级最高 C。");
  }
  if ((isFull && (dimension(4).score === 1 || dimension(5).score === 1)) ||
      (!isFull && dimension(4).score === 1)) {
    add(7, "D", "数据来源不清或抓取规则基本缺失，最终等级最高 D。");
  }
  if (dimension(11).score === 1 ||
      !normalizeText(input.independentVariables) ||
      !normalizeText(input.dependentVariables)) {
    add(8, "D", "核心变量无法操作化，最终等级最高 D。");
  }

  const associationText = joinFields(input, ["dataSource", "scrapingPlan", "timeWindow", "unitOfAnalysis"]);
  if (hasAny(associationText, SCORING_CONFIG.keywords.bigData) && dimension(7).score <= 2) {
    add(9, "D", "海量数据之间没有明确的事件、主体、时间或传播链关系，最终等级最高 D。");
  }
  if (isFull && !normalizeText(input.literature)) {
    add(10, "C", "没有任何 CSSCI/SSCI 或经典文献锚定，最终等级最高 C。");
  }

  const hardMethodText = joinFields(input, ["methods", "samplingRules", "robustness", "expectedConclusion"]);
  const explicitHardErrors = [
    "无需处理缺失", "不需要信度", "显著就说明影响大", "p值越小效应越大",
    "随机选择方便样本", "用普通回归证明因果", "相关即因果", "忽略内生性",
    "所有评论代表公众", "不控制时间", "无需稳健性"
  ];
  const hardErrorCount = uniqueMatches(hardMethodText, explicitHardErrors);
  if (isFull && hardErrorCount >= 2) {
    add(11, "D", "明确出现多项基础统计、社会研究方法或计量经济学硬伤，最终等级最高 D。");
  } else if (isFull && hardErrorCount === 1) {
    add(11, "C", "明确出现基础统计、社会研究方法或计量经济学硬伤，最终等级最高 C。");
  }

  const evidenceText = joinFields(input, ["researchObject", "dataSource", "expectedConclusion"]);
  if (hasAny(evidenceText, SCORING_CONFIG.keywords.effectObjects) &&
      hasAny(evidenceText, SCORING_CONFIG.keywords.contentOnly) &&
      !hasAny(evidenceText, SCORING_CONFIG.keywords.evidenceReceiver)) {
    add(12, "C", "使用内容数据直接证明传播效果，且无接受端或行为端证据，最终等级最高 C。");
  }
  if (inspections.proxy.risky) {
    add(13, "C", inspections.proxy.message + " 最终等级最高 C。");
  }

  const methodText = normalizeText(input.methods);
  if (hasAny(methodText, SCORING_CONFIG.keywords.advancedMethods) &&
      !hasAny(methodText, SCORING_CONFIG.keywords.methodLink)) {
    add(14, "C", "复杂方法与研究问题的对应关系不清，最终等级最高 C。");
  }
  return triggers;
}

function calculateAxes(dimensions, mode) {
  const axisConfig = mode === "quick" ? SCORING_CONFIG.quickAxes : SCORING_CONFIG.axes;
  return axisConfig.map(function (axis) {
    const relevant = dimensions.filter(function (dimension) {
      return axis.dimensions.includes(dimension.id);
    });
    const score = relevant.reduce(function (sum, item) { return sum + item.score; }, 0) / relevant.length;
    return {
      id: axis.id,
      name: axis.name,
      score: Number(score.toFixed(2))
    };
  });
}

function applyGradeCaps(rawGrade, downgrades) {
  return downgrades.reduce(function (grade, trigger) {
    return worseGrade(grade, trigger.cap);
  }, rawGrade);
}

function buildTopicDiagnostics(input, dimensions, inspections, mode) {
  const dimension = function (id) {
    return dimensions.find(function (item) { return item.id === id; });
  };
  const toolStatus = inspections.tools.ratio >= 0.55
    ? "研究工具已形成较具体骨架。"
    : "当前仍停留在选题想法阶段，尚未形成可执行的研究设计。";

  const diagnostics = [
    {
      title: "研究问题诊断",
      body: dimension(1).diagnosis + " " + dimension(2).diagnosis + " " + dimension(3).diagnosis
    },
    {
      title: "数据诊断",
      body: dimension(4).diagnosis + " " + dimension(5).diagnosis + " " + dimension(7).diagnosis
    },
    {
      title: "研究对象—数据库匹配诊断",
      body: inspections.objectDatabase.message
    },
    {
      title: "变量诊断",
      body: "自变量：" + dimension(8).diagnosis + " 因变量：" + dimension(9).diagnosis +
        " 机制变量：" + dimension(10).diagnosis + " 控制变量：" +
        (normalizeText(input.controlVariables)
          ? "已列出控制变量，但需逐项核对理论依据、层级与数据生成过程。"
          : "未设计控制变量，模型容易受到遗漏变量影响。")
    },
    {
      title: "方法诊断",
      body: dimension(12).diagnosis + " " + dimension(13).diagnosis + " " +
        dimension(14).diagnosis + " " + dimension(15).diagnosis + " " +
        dimension(16).diagnosis + " " + dimension(17).diagnosis + " " +
        toolStatus + " 已识别研究工具 " + inspections.tools.found.length + "/20 项。"
    },
    {
      title: "证据—结论匹配诊断",
      body: inspections.evidence.message + " " + inspections.causal.message + " " + inspections.proxy.message
    },
    {
      title: "CSSCI/SSCI 文献锚定诊断",
      body: dimension(18).diagnosis + " " + dimension(19).diagnosis
    }
  ];
  if (mode === "quick") {
    return diagnostics.filter(function (item) {
      return [
        "研究问题诊断", "数据诊断", "研究对象—数据库匹配诊断",
        "变量诊断", "证据—结论匹配诊断"
      ].includes(item.title);
    });
  }
  return diagnostics;
}

function buildReviewerRisks(input, dimensions, inspections, downgrades, mode) {
  const risks = [];
  const pushUnique = function (text) {
    if (text && !risks.includes(text)) risks.push(text);
  };
  downgrades.forEach(function (trigger) {
    pushUnique(trigger.message.replace(/，最终等级最高 [A-E]。/g, "。").replace(/ 最终等级最高 [A-E]。/g, "。"));
  });
  if (hasAny(joinFields(input, ["dataSource", "scrapingPlan"]), ["微博", "抖音", "小红书", "公众号", "评论"])) {
    pushUnique("样本代表性边界仍需说明：平台用户、可见评论和被抓取内容不等于总体公众。");
  }
  if (mode === "full" && normalizeText(input.methods) &&
      (!inspections.causal.hasCausalDesign ||
       hasAny(input.methods, ["回归", "logit", "观察性", "固定效应"]))) {
    pushUnique("因果边界必须贯穿全文：观察性关联即使通过多模型检验，也不能自动升级为因果效应。");
  }
  if (mode === "full" &&
      !hasAny(input.robustness, ["kappa", "krippendorff", "信度", "一致性"]) &&
      hasAny(input.methods, ["编码", "分类", "bert", "roberta", "lda"])) {
    pushUnique("文本分类可信度不足：缺少人工编码一致性、训练集构造和模型性能的完整报告。");
  }
  if (mode === "full" && normalizeText(input.literature).length < 120) {
    pushUnique("文献锚定不足：当前设计尚未证明其接续了哪一组 CSSCI/SSCI 问题传统与方法范式。");
  }
  dimensions
    .filter(function (item) { return item.score <= 2; })
    .sort(function (a, b) { return a.score - b.score; })
    .forEach(function (item) { pushUnique(item.name + "薄弱：" + item.diagnosis); });
  if (mode === "full" && inspections.tools.ratio < 0.55) {
    pushUnique("研究工具尚未落地：编码表、变量定义、清洗规则、模型诊断或信效度方案大量缺失。");
  }
  if (risks.length < 3) {
    pushUnique("样本代表性边界仍需说明：平台用户、可见评论和被抓取内容不等于总体公众。");
    pushUnique("观察性数据中的内生性与反向因果仍可能使解释超出证据能力。");
  }
  return risks.slice(0, 5);
}

function buildPrioritizedRisks(baseRisks, downgrades, alignment) {
  const risks = [];
  const seen = new Set();
  const add = function (priority, message, source) {
    const key = normalizeText(message).replace(/[，。；：\s]/g, "").slice(0, 48);
    if (!message || seen.has(key)) return;
    seen.add(key);
    risks.push({
      priority: priority,
      label: priority === "fatal" ? "致命风险" : (priority === "major" ? "重大风险" : "一般风险"),
      message: message,
      source: source || "review"
    });
  };

  alignment.risks.forEach(function (risk) {
    add(risk.priority, risk.message, "alignment");
  });
  downgrades.forEach(function (trigger) {
    const fatalRules = [2, 3, 7, 8, 9, 12];
    const priority = trigger.cap === "D" || fatalRules.includes(trigger.rule) ? "fatal" : "major";
    add(priority, trigger.message.replace(/最终等级最高 [A-E]。?/g, ""), "downgrade");
  });
  baseRisks.forEach(function (message) {
    let priority = "general";
    if (hasAny(message, ["无法验证", "不对应", "内容层", "核心变量无法"]) ||
        (hasAny(message, ["因果"]) &&
         hasAny(message, ["越界", "缺少识别", "无法支持", "写成因果"]))) {
      priority = "fatal";
    } else if (hasAny(message, [
      "样本代表性", "文献锚定", "理论依据", "分析单位",
      "研究工具", "文本分类", "数据拼接", "机制", "因果边界"
    ])) {
      priority = "major";
    }
    add(priority, message, "review");
  });

  const order = { fatal: 0, major: 1, general: 2 };
  return risks.sort(function (a, b) {
    return order[a.priority] - order[b.priority];
  }).slice(0, 10);
}

function buildRuleAudit(dimensions, downgrades, confidence, completeness, literatureAnchor, reviewerRisks) {
  const sorted = dimensions.slice().sort(function (a, b) { return a.score - b.score; });
  const lowering = sorted.slice(0, 3).map(function (item) {
    return item.name + "（" + item.score + "/5）";
  });
  const supporting = sorted.slice().reverse().slice(0, 3).map(function (item) {
    return item.name + "（" + item.score + "/5）";
  });
  const groupByRule = {
    1: "discipline",
    2: "evidence", 3: "evidence", 12: "evidence", 13: "evidence",
    4: "variables", 8: "variables",
    5: "methods", 6: "methods", 11: "methods", 14: "methods",
    7: "data", 9: "data",
    10: "literature"
  };
  const downgradeGroups = {};
  downgrades.forEach(function (item) {
    const group = groupByRule[item.rule] || "other";
    if (!downgradeGroups[group]) downgradeGroups[group] = [];
    downgradeGroups[group].push(item.rule);
  });
  const repeatedGroups = Object.keys(downgradeGroups).filter(function (group) {
    return downgradeGroups[group].length > 1;
  });
  const methodRules = downgrades.filter(function (item) {
    return [5, 6, 11, 13, 14].includes(item.rule);
  });
  const fatalRiskCount = reviewerRisks.filter(function (risk) {
    return risk.priority === "fatal";
  }).length;
  const reviewReasons = [];
  if (completeness.score < 80) reviewReasons.push("研究设计完整度不足 80");
  if (downgrades.length) reviewReasons.push("触发 " + downgrades.length + " 条硬性降级");
  if (fatalRiskCount) reviewReasons.push("存在 " + fatalRiskCount + " 条致命风险");
  if (!literatureAnchor.primary || literatureAnchor.primary.score < 6) {
    reviewReasons.push("文献传统匹配较弱");
  }
  if (confidence.level !== "高") reviewReasons.push("评分可信度为" + confidence.level);
  return {
    loweringDimensions: lowering,
    supportingDimensions: supporting,
    duplicateDowngrade: {
      exists: repeatedGroups.length > 0,
      groups: repeatedGroups,
      explanation: repeatedGroups.length
        ? "存在同类降级信号（" + repeatedGroups.join("、") +
          "），但系统只采用最严格的等级上限，不累计重复扣分。"
        : "未发现同类降级规则重复触发。"
    },
    insufficientInput: {
      exists: completeness.score < 60 || confidence.level === "低",
      explanation: completeness.score < 60 || confidence.level === "低"
        ? "输入不足可能同时造成低分和低可信度，应先补材料再解释等级。"
        : "当前输入量足以支持初步规则诊断。"
    },
    methodHardDowngrade: {
      exists: methodRules.length > 0,
      rules: methodRules.map(function (item) { return item.rule; }),
      explanation: methodRules.length
        ? "方法风险触发硬性降级规则：" + methodRules.map(function (item) {
          return item.rule;
        }).join("、") + "。"
        : "未由方法风险直接触发硬性降级。"
    },
    manualReview: {
      recommended: reviewReasons.length > 0,
      reasons: reviewReasons,
      explanation: reviewReasons.length
        ? "建议人工复核：" + reviewReasons.join("；") + "。"
        : "规则结果稳定，可进入常规人工确认。"
    }
  };
}

function buildRuleTrace(input, dimensions, downgrades, rawScore, rawGrade, finalGrade) {
  const dimensionTraces = dimensions.map(function (dimension) {
    const fields = SCORING_CONFIG.dimensionTraceFields[dimension.id] || [];
    const present = fields.filter(function (field) { return normalizeText(input[field]); });
    const missing = fields.filter(function (field) { return !normalizeText(input[field]); });
    const baseScore = fields.length
      ? Math.max(1, Math.min(3, 1 + Math.round(present.length / fields.length * 2)))
      : 1;
    const matchedSignals = present.map(function (field) {
      return SCORING_CONFIG.fieldLabels[field] + "已提供";
    });
    const missingSignals = missing.map(function (field) {
      return SCORING_CONFIG.fieldLabels[field] + "缺失";
    });
    return {
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      baseScore: baseScore,
      adjustedScore: dimension.score,
      matchedSignals: matchedSignals,
      missingSignals: missingSignals,
      penaltyReasons: dimension.score <= 2
        ? [dimension.diagnosis].concat(missingSignals)
        : (dimension.score < baseScore ? [dimension.diagnosis] : []),
      boostReasons: dimension.score >= 4
        ? [dimension.diagnosis].concat(matchedSignals.slice(0, 2))
        : (dimension.score > baseScore ? [dimension.diagnosis] : [])
    };
  });
  const hardRules = SCORING_CONFIG.hardRuleDefinitions.map(function (definition) {
    const trigger = downgrades.find(function (item) { return item.rule === definition.id; });
    return {
      ruleId: definition.id,
      ruleName: definition.name,
      triggered: Boolean(trigger),
      evidence: trigger ? trigger.message : "未命中触发条件",
      gradeCap: trigger ? trigger.cap : definition.cap
    };
  });
  return {
    dimensions: dimensionTraces,
    hardRules: hardRules,
    gradeDecision: {
      rawAverageScore: rawScore,
      rawGrade: rawGrade,
      triggeredCaps: downgrades.map(function (item) {
        return { ruleId: item.rule, gradeCap: item.cap, evidence: item.message };
      }),
      finalGrade: finalGrade,
      finalDecisionReason: downgrades.length
        ? "原始等级 " + rawGrade + " 受到 " + downgrades.length +
          " 条等级上限约束，最终采用最严格结果 " + finalGrade + "。"
        : "未触发硬性等级上限，最终等级与原始等级一致。"
    }
  };
}

function detectDuplicatePenalties(evaluationResult) {
  const input = evaluationResult.input || {};
  const issues = [];
  const addIssue = function (problem, dimensionIds, evidence) {
    const dimensions = evaluationResult.dimensions.filter(function (dimension) {
      return dimensionIds.includes(dimension.id);
    }).map(function (dimension) { return dimension.name; });
    if (dimensions.length >= 2) {
      issues.push({
        problem: problem,
        dimensions: dimensions,
        evidence: evidence
      });
    }
  };
  if (!normalizeText(input.dataSource)) {
    addIssue("数据来源缺失的多重影响", [4, 5, 6, 7],
      "同一缺失同时影响数据来源、抓取可执行性、对象匹配和数据关联。");
  }
  if (!normalizeText(input.theory)) {
    addIssue("理论基础缺失的多重影响", [3, 8, 9, 10, 18],
      "同一缺失同时影响理论清晰度、变量依据、机制链和文献锚定。");
  }
  if (!normalizeText(input.unitOfAnalysis)) {
    addIssue("分析单位缺失的多重影响", [6, 12, 13],
      "同一缺失同时影响对象层级、分析单位和模型匹配。");
  }
  const repeatedAudit = evaluationResult.ruleAudit &&
    evaluationResult.ruleAudit.duplicateDowngrade.exists;
  return {
    exists: issues.length > 0 || Boolean(repeatedAudit),
    issues: issues,
    involvedDimensions: Array.from(new Set(issues.flatMap(function (item) {
      return item.dimensions;
    }))),
    manualReviewRecommended: issues.length > 0 || Boolean(repeatedAudit),
    message: issues.length > 0 || repeatedAudit
      ? "本次低分可能部分来自同一缺陷的多重影响，建议人工复核是否过度降级。"
      : "未发现典型的同一缺陷多重惩罚。"
  };
}

function analyzeWeightSensitivity(axes, downgrades, rawScore, finalGrade, mode) {
  if (mode !== "full" || axes.length !== 5) {
    return {
      available: false,
      originalGrade: finalGrade,
      minGrade: finalGrade,
      maxGrade: finalGrade,
      stable: true,
      stabilityLabel: "快速模式不执行五轴权重敏感性分析",
      mostSensitiveAxis: "不适用",
      variants: [],
      explanation: "请切换到完整研究计划诊断后运行五大轴心权重 ±10% 分析。"
    };
  }
  const totalDimensions = SCORING_CONFIG.axes.reduce(function (sum, axis) {
    return sum + axis.dimensions.length;
  }, 0);
  const baseWeights = SCORING_CONFIG.axes.map(function (axis) {
    return axis.dimensions.length / totalDimensions;
  });
  const variants = [];
  axes.forEach(function (axis, axisIndex) {
    [-0.1, 0.1].forEach(function (change) {
      const weights = baseWeights.slice();
      weights[axisIndex] *= (1 + change);
      const weightSum = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
      const normalizedWeights = weights.map(function (weight) { return weight / weightSum; });
      const score = Number(axes.reduce(function (sum, item, index) {
        return sum + item.score * normalizedWeights[index];
      }, 0).toFixed(2));
      const weightedGrade = rawGradeFromScore(score);
      const cappedGrade = applyGradeCaps(weightedGrade, downgrades);
      variants.push({
        axisId: axis.id,
        axisName: axis.name,
        adjustment: change > 0 ? "+10%" : "-10%",
        score: score,
        rawGrade: weightedGrade,
        finalGrade: cappedGrade,
        changed: cappedGrade !== finalGrade,
        scoreDelta: Number((score - rawScore).toFixed(2))
      });
    });
  });
  const grades = [finalGrade].concat(variants.map(function (item) { return item.finalGrade; }));
  const order = SCORING_CONFIG.gradeOrder;
  const bestGrade = grades.slice().sort(function (a, b) {
    return order.indexOf(a) - order.indexOf(b);
  })[0];
  const worstGrade = grades.slice().sort(function (a, b) {
    return order.indexOf(b) - order.indexOf(a);
  })[0];
  const changedCount = variants.filter(function (item) { return item.changed; }).length;
  const mostSensitive = variants.slice().sort(function (a, b) {
    return Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta);
  })[0];
  const stable = changedCount <= 1;
  return {
    available: true,
    originalGrade: finalGrade,
    minGrade: worstGrade,
    maxGrade: bestGrade,
    stable: stable,
    stabilityLabel: changedCount === 0
      ? "评分稳定性较高"
      : (changedCount <= 3 ? "评分稳定性中等" : "评分稳定性低"),
    mostSensitiveAxis: mostSensitive ? mostSensitive.axisName : "无",
    variants: variants,
    explanation: changedCount === 0
      ? "五大轴心分别进行 ±10% 权重调整后，最终等级未变化；硬性降级规则始终优先。"
      : "共有 " + changedCount + "/10 次权重调整改变最终等级，结果接近等级阈值；硬性降级规则始终优先。"
  };
}

function bestDimensionText(dimensions) {
  const best = dimensions.slice().sort(function (a, b) { return b.score - a.score; })[0];
  return best && best.score >= 3
    ? "保留“" + best.name + "”中已经成形的设计，并把它作为重构支点。"
    : "保留现实问题意识，但暂不保留现有变量—模型组合。";
}

function buildRevisionPath(input, dimensions, inspections, finalGrade) {
  const lowNames = dimensions
    .filter(function (item) { return item.score <= 2; })
    .map(function (item) { return item.name; });
  const keep = bestDimensionText(dimensions);
  const remove = inspections.causal.risky || inspections.proxy.risky
    ? "删除未经识别的因果语言，以及把点赞、评论、转发直接解释为心理结果的表述。"
    : "删除仅用于展示“方法高级”但不直接回答研究问题的模型或数据模块。";
  const supplementData = inspections.objectDatabase.status === "mismatch" || inspections.evidence.mismatch
    ? "补充与研究对象同层的证据，优先增加接受端、行为端、转发链或曝光排序数据。"
    : "补充抽样依据、抓取日志、变量字段、排除规则和样本代表性说明。";
  const resetVariables = dimensions.find(function (item) { return item.id === 11; }).score <= 3
    ? "为核心变量重写概念定义、编码规则、取值、正反例与效度依据；机制每一环单独测量。"
    : "保持核心变量，但核对层级、时序与代理指标效度，避免跨层解释。";
  const adjustMethods = dimensions.find(function (item) { return item.id === 13; }).score <= 3
    ? "从因变量尺度、数据分布、嵌套结构和识别目标反推模型，并补模型公式与标准误层级。"
    : "保留主模型，补替代模型、敏感性分析、模型诊断与不确定性报告。";
  const narrowConclusion = "把结论限定到“" +
    (normalizeText(input.unitOfAnalysis) || "当前分析单位") +
    "”及当前平台、时间窗与样本，相关性设计只写关联，不写因果。";
  const invest = finalGrade === "A" || finalGrade === "B"
    ? "值得继续投入，但应先完成文献、工具与识别风险清单，再启动大规模采集。"
    : (finalGrade === "C"
      ? "暂缓大规模采集；先用小样本验证对象—数据—变量链，重构后再决定。"
      : "当前不值得继续投入原方案；建议更换可观察对象或降低问题层级后重做预研究。");

  return [
    { title: "可以保留什么", text: keep },
    { title: "必须删除什么", text: remove },
    { title: "需要补充什么数据", text: supplementData },
    { title: "需要重设哪些变量", text: resetVariables },
    { title: "需要调整什么方法", text: adjustMethods },
    { title: "需要降低或重写哪些结论", text: narrowConclusion },
    { title: "是否值得继续投入", text: invest + (lowNames.length ? " 优先修复：" + lowNames.slice(0, 4).join("、") + "。" : "") }
  ];
}

function buildMinimumDesign(input, inspections) {
  const object = normalizeText(input.researchObject) || "一个可由数据直接观察的传播现象";
  const unit = normalizeText(input.unitOfAnalysis) || "单条内容或单个受众反应记录，并明确嵌套层级";
  const source = normalizeText(input.dataSource) || "与研究对象同层、来源可核验且保留抓取日志的数据";
  const time = normalizeText(input.timeWindow) || "围绕明确事件节点设置有依据的前后窗口或连续观察期";
  const iv = normalizeText(input.independentVariables) || "由传播学理论导出的内容、主体或平台特征";
  const dv = normalizeText(input.dependentVariables) || "与分析单位同层且可复核的表达、互动、扩散或接受指标";
  const mechanism = normalizeText(input.mechanismVariables) ||
    "只保留能够独立测量、具有明确时间顺序且连接自变量与因变量的机制变量";
  const controls = normalizeText(input.controlVariables) || "平台、主体、时间、内容与基线差异等理论相关控制变量";
  const model = normalizeText(input.methods)
    ? "保留与变量尺度匹配的主模型；明确模型公式、聚类层级、固定效应与估计对象。"
    : "依据结果变量类型选择线性、Logit、多项 Logit、计数或多层模型，不以复杂度替代匹配度。";
  const robustness = normalizeText(input.robustness) || "替代变量、替代模型、替代样本、敏感性分析及人工编码一致性";
  const boundary = inspections.evidence.mismatch || inspections.causal.risky
    ? "只对当前样本中的可观察表达或关联作结论；不外推总体态度，不主张未经识别的因果。"
    : "结论限定于当前分析单位、平台、样本与时间窗，并明确效应或关联的识别边界。";
  let maximumProof = "在当前平台、样本、时间窗和分析单位内，变量之间存在可复核的分布差异或统计关联。";
  let cannotProof = "不能据此证明总体公众态度、真实心理变化或未经识别的因果效应。";
  const dataText = joinFields(input, ["dataSource", "scrapingPlan"]);
  if (hasAny(dataText, SCORING_CONFIG.keywords.contentOnly)) {
    maximumProof = "发布端内容中的框架、议题、主体或文本特征及其分布关系。";
    cannotProof = "不能仅凭内容文本证明受众认知、态度、行为或传播效果。";
  } else if (hasAny(dataText, ["评论", "弹幕", "转发语"])) {
    maximumProof = "特定平台可见评论样本中的表达类型、互动结构及其统计关联。";
    cannotProof = "不能把平台评论外推为总体公众态度，也不能把点赞、评论或转发直接解释为认同、说服或实际参与。";
  } else if (hasAny(dataText, ["转发链", "传播链", "互动网络"])) {
    maximumProof = "所观察传播网络中的节点关系、扩散路径、时序模式及其关联。";
    cannotProof = "不能在缺少曝光和反事实设计时证明平台算法机制或个体层因果效果。";
  }

  return [
    { label: "建议研究问题", text: "在" + object + "中，理论导出的传播特征与可观察结果之间存在何种关系，边界条件是什么？" },
    { label: "建议分析单位", text: unit },
    { label: "建议数据范围", text: source + "；明确平台、主体、字段、纳入与排除边界。" },
    { label: "建议时间窗口", text: time },
    { label: "建议自变量", text: iv },
    { label: "建议因变量", text: dv },
    { label: "建议机制变量", text: mechanism },
    { label: "建议控制变量", text: controls },
    { label: "建议模型", text: model },
    { label: "必须补充的信度检验", text: "人工编码报告 Cohen's Kappa 或 Krippendorff's Alpha；自动分类报告训练集、验证集、F1、混淆矩阵与误差分析。" },
    { label: "必须补充的效度检验", text: "说明内容效度、构念效度、代理指标效度；必要时使用专家评审、预测试、聚合/区分效度或与人工金标准比较。" },
    { label: "稳健性检验", text: robustness },
    { label: "结论边界", text: boundary },
    { label: "本研究最多能证明什么", text: maximumProof },
    { label: "本研究不能证明什么", text: cannotProof }
  ];
}

function buildVerdict(finalGrade, rawScore, downgrades) {
  const messages = {
    A: "传播问题、对象—数据、变量—理论与方法链条均较完整，值得进入正式研究。",
    B: "研究值得继续，但必须先补强最薄弱的证据、文献或方法环节。",
    C: "暂缓大规模投入；当前核心问题可修，但需要重构关键链条。",
    D: "不建议沿原方案继续，结构性风险已经超过局部补分析所能修复的范围。",
    E: "概念、数据或设计链条基本崩塌，应回到研究问题重新开始。"
  };
  return {
    oneLine: messages[finalGrade],
    invest: finalGrade === "A" || finalGrade === "B"
      ? "值得继续投入：是，但先完成针对性补强。"
      : (finalGrade === "C"
        ? "值得继续投入：仅建议投入小样本预研究，不建议立即大规模抓取。"
        : "值得继续投入：否，优先重构选题与证据层级。"),
    rawNote: downgrades.length
      ? "原始均分对应 " + rawGradeFromScore(rawScore) + "，硬性规则将最终等级限制为 " + finalGrade
      : "原始均分与最终等级一致，未受硬性上限调整"
  };
}

function evaluatePaperWorthiness(input) {
  input = input || {};
  const mode = input && input.diagnosisMode === "quick" ? "quick" : "full";
  const testCaseId = input && input.testCaseId ? String(input.testCaseId) : "";
  const safeInput = {};
  SCORING_CONFIG.fields.forEach(function (field) {
    safeInput[field] = String(input[field] || "").trim();
  });
  safeInput.diagnosisMode = mode;
  const scoringInput = Object.assign({}, safeInput);
  if (mode === "quick") {
    SCORING_CONFIG.modes.quick.ignoredFields.forEach(function (field) {
      scoringInput[field] = "";
    });
  }

  const inspections = {
    theoryChain: findTheoryChain(scoringInput),
    objectDatabase: inspectObjectDatabaseMatch(scoringInput),
    evidence: inspectEvidenceConclusion(scoringInput),
    causal: inspectCausalRisk(scoringInput),
    proxy: inspectProxyClaims(scoringInput),
    tools: inspectResearchTools(scoringInput)
  };
  const allDimensions = evaluateDimensions(scoringInput, inspections);
  const activeDimensionIds = SCORING_CONFIG.modes[mode].dimensions;
  const dimensions = allDimensions.filter(function (dimension) {
    return activeDimensionIds.includes(dimension.id);
  });
  const rawScore = Number((dimensions.reduce(function (sum, item) {
    return sum + item.score;
  }, 0) / dimensions.length).toFixed(2));
  const rawGrade = rawGradeFromScore(rawScore);
  const downgrades = evaluateHardDowngrades(scoringInput, allDimensions, inspections, mode);
  const finalGrade = applyGradeCaps(rawGrade, downgrades);
  const axes = calculateAxes(dimensions, mode);
  const confidence = buildConfidence(safeInput, mode);
  const designCompleteness = calculateDesignCompleteness(scoringInput);
  const literatureAnchor = matchLiteratureAnchors(scoringInput);
  const alignment = buildAlignmentMatrix(scoringInput, allDimensions, inspections, mode);
  const diagnostics = buildTopicDiagnostics(scoringInput, allDimensions, inspections, mode);
  const baseReviewerRisks = buildReviewerRisks(
    scoringInput, dimensions, inspections, downgrades, mode
  );
  const reviewerRisks = buildPrioritizedRisks(baseReviewerRisks, downgrades, alignment);
  const ruleAudit = buildRuleAudit(
    dimensions, downgrades, confidence, designCompleteness,
    literatureAnchor, reviewerRisks
  );
  const revisionPath = buildRevisionPath(scoringInput, allDimensions, inspections, finalGrade);
  const minimumDesign = buildMinimumDesign(scoringInput, inspections);
  const ruleTrace = buildRuleTrace(
    scoringInput, dimensions, downgrades, rawScore, rawGrade, finalGrade
  );
  const weightSensitivity = analyzeWeightSensitivity(
    axes, downgrades, rawScore, finalGrade, mode
  );
  const verdict = buildVerdict(finalGrade, rawScore, downgrades);
  const testCase = CALIBRATION_CASES.find(function (item) { return item.id === testCaseId; });
  const result = {
    version: SCORING_CONFIG.version,
    evaluatedAt: new Date().toISOString(),
    mode: mode,
    modeName: SCORING_CONFIG.modes[mode].name,
    input: safeInput,
    rawScore: rawScore,
    rawGrade: rawGrade,
    finalGrade: finalGrade,
    verdict: verdict,
    axes: axes,
    dimensions: dimensions,
    confidence: confidence,
    designCompletenessScore: designCompleteness.score,
    designCompleteness: designCompleteness,
    literatureAnchor: literatureAnchor,
    alignment: alignment,
    downgrades: downgrades,
    diagnostics: diagnostics,
    reviewerRisks: reviewerRisks,
    ruleAudit: ruleAudit,
    ruleTrace: ruleTrace,
    weightSensitivity: weightSensitivity,
    revisionPath: revisionPath,
    minimumDesign: minimumDesign,
    inspections: inspections,
    calibration: testCase ? {
      caseId: testCase.id,
      caseName: testCase.title,
      caseType: testCase.caseType,
      expectedGrade: testCase.expectedGrade,
      expectedReason: testCase.expectedReason,
      actualGrade: finalGrade,
      matched: testCase.expectedGrade === finalGrade
    } : null
  };
  result.duplicatePenalties = detectDuplicatePenalties(result);
  result.markdown = generateMarkdownReport(result);
  return result;
}

function buildMisclassificationLog(calibrationCase, evaluation) {
  const order = SCORING_CONFIG.gradeOrder;
  const expectedIndex = order.indexOf(calibrationCase.expectedGrade);
  const actualIndex = order.indexOf(evaluation.finalGrade);
  if (expectedIndex < 0) return null;
  if (expectedIndex === actualIndex) return null;
  const overestimated = actualIndex < expectedIndex;
  const reasons = [];
  const labels = SCORING_CONFIG.calibration.misclassificationReasons;
  if (overestimated) {
    reasons.push(labels.tooLoose);
    const methodDimension = evaluation.dimensions.find(function (item) { return item.id === 13; });
    if (methodDimension && methodDimension.score <= 2) reasons.push(labels.weakMethodCheck);
    if (!evaluation.literatureAnchor.primary || evaluation.literatureAnchor.primary.score < 6) {
      reasons.push(labels.weakLiteratureCheck);
    }
  } else {
    reasons.push(labels.tooStrict);
    if (evaluation.ruleAudit.duplicateDowngrade.exists) reasons.push(labels.duplicateDowngrade);
  }
  if (evaluation.designCompletenessScore < 60) reasons.push(labels.insufficientInput);
  return {
    id: calibrationCase.id,
    caseName: calibrationCase.title,
    humanGrade: calibrationCase.expectedGrade,
    systemGrade: evaluation.finalGrade,
    type: overestimated ? "高估" : "低估",
    magnitude: Math.abs(actualIndex - expectedIndex),
    possibleReasons: Array.from(new Set(reasons)),
    suggestion: overestimated
      ? SCORING_CONFIG.calibration.adjustmentDirections.overestimate
      : SCORING_CONFIG.calibration.adjustmentDirections.underestimate,
    ruleCorrectionSuggestions: overestimated ? [
      "检查硬性降级规则是否过松",
      "检查数据—问题匹配规则是否未触发",
      "检查方法越界识别是否不足",
      "检查文献锚定是否只是形式匹配"
    ] : [
      "检查是否存在重复惩罚",
      "检查早期选题是否被完整研究计划标准过度惩罚",
      "检查某些字段为空是否导致过度降级",
      "检查文献锚定库是否覆盖不足"
    ]
  };
}

function mostFrequentValue(values, fallback) {
  if (!values.length) return { value: fallback || "无", count: 0 };
  const counts = {};
  values.forEach(function (value) {
    const key = String(value);
    counts[key] = (counts[key] || 0) + 1;
  });
  const winner = Object.keys(counts).sort(function (a, b) {
    return counts[b] - counts[a] || a.localeCompare(b, "zh-CN");
  })[0];
  return { value: winner, count: counts[winner] };
}

function buildMisclassificationSummary(rows, logs) {
  const bcBoundary = rows.filter(function (row) {
    const pair = [row.expectedGrade, row.actualGrade].filter(Boolean);
    return Math.abs(row.rawScore - 3.4) <= 0.15 ||
      (pair.includes("B") && pair.includes("C"));
  }).length;
  const cdBoundary = rows.filter(function (row) {
    const pair = [row.expectedGrade, row.actualGrade].filter(Boolean);
    return Math.abs(row.rawScore - 2.6) <= 0.15 ||
      (pair.includes("C") && pair.includes("D"));
  }).length;
  const downgradeFrequency = mostFrequentValue(rows.flatMap(function (row) {
    return row.downgradeRules.map(function (rule) { return "规则 " + rule; });
  }), "无");
  const tagFrequency = mostFrequentValue(rows.flatMap(function (row) {
    return row.tags || [];
  }), "无标签");
  const reasonFrequency = mostFrequentValue(logs.flatMap(function (log) {
    return log.possibleReasons || [];
  }), "无误判");
  return {
    overestimated: rows.filter(function (row) { return row.direction === "高估"; }).length,
    underestimated: rows.filter(function (row) { return row.direction === "低估"; }).length,
    bcBoundary: bcBoundary,
    cdBoundary: cdBoundary,
    insufficientLowConfidence: rows.filter(function (row) {
      return row.confidence === "低" && row.evaluation.ruleAudit.insufficientInput.exists;
    }).length,
    duplicatePenaltyCases: rows.filter(function (row) {
      return row.evaluation.duplicatePenalties.exists;
    }).length,
    mostCommonDowngrade: downgradeFrequency,
    mostCommonRiskTag: tagFrequency,
    mostCommonMisclassificationReason: reasonFrequency,
    boundaryExplanation: "边界案例按综合分距等级阈值不超过 0.15，或人工与系统等级跨越相邻边界统计。"
  };
}

function runCalibrationCases(cases, options) {
  const calibrationCases = cases || CALIBRATION_CASES;
  const calibrationOptions = options || {};
  const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const expectedDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const typeMap = {};
  const rows = calibrationCases.map(function (calibrationCase) {
    const evaluation = evaluatePaperWorthiness(Object.assign(
      {}, calibrationCase.inputData, { testCaseId: calibrationCase.id }
    ));
    const expectedGrade = SCORING_CONFIG.gradeOrder.includes(calibrationCase.expectedGrade)
      ? calibrationCase.expectedGrade
      : "";
    const labeled = Boolean(expectedGrade);
    const expectedIndex = SCORING_CONFIG.gradeOrder.indexOf(expectedGrade);
    const actualIndex = SCORING_CONFIG.gradeOrder.indexOf(evaluation.finalGrade);
    const consistent = labeled ? expectedIndex === actualIndex : null;
    const direction = !labeled
      ? "待标注"
      : (actualIndex < expectedIndex ? "高估" : (actualIndex > expectedIndex ? "低估" : "一致"));
    distribution[evaluation.finalGrade] += 1;
    if (labeled) expectedDistribution[expectedGrade] += 1;
    if (!typeMap[calibrationCase.caseType]) {
      typeMap[calibrationCase.caseType] = {
        caseType: calibrationCase.caseType,
        total: 0,
        labeled: 0,
        misclassified: 0,
        overestimated: 0,
        underestimated: 0
      };
    }
    typeMap[calibrationCase.caseType].total += 1;
    if (labeled) typeMap[calibrationCase.caseType].labeled += 1;
    if (labeled && !consistent) {
      typeMap[calibrationCase.caseType].misclassified += 1;
      if (direction === "高估") typeMap[calibrationCase.caseType].overestimated += 1;
      if (direction === "低估") typeMap[calibrationCase.caseType].underestimated += 1;
    }
    return {
      id: calibrationCase.id,
      title: calibrationCase.title,
      caseType: calibrationCase.caseType,
      tags: Array.isArray(calibrationCase.tags) ? calibrationCase.tags.slice() : [],
      status: labeled ? (calibrationCase.status || "已标注") : "待标注",
      humanReview: calibrationCase.humanReview || null,
      expectedGrade: expectedGrade,
      expectedReason: calibrationCase.expectedReason,
      actualGrade: evaluation.finalGrade,
      rawScore: evaluation.rawScore,
      consistent: consistent,
      direction: direction,
      magnitude: labeled ? Math.abs(actualIndex - expectedIndex) : null,
      downgradeRules: evaluation.downgrades.map(function (item) { return item.rule; }),
      confidence: evaluation.confidence.level,
      designCompletenessScore: evaluation.designCompletenessScore,
      fatalRisksCount: evaluation.reviewerRisks.filter(function (risk) {
        return risk.priority === "fatal";
      }).length,
      majorRisksCount: evaluation.reviewerRisks.filter(function (risk) {
        return risk.priority === "major";
      }).length,
      minorRisksCount: evaluation.reviewerRisks.filter(function (risk) {
        return risk.priority === "general";
      }).length,
      mainRisks: evaluation.reviewerRisks.slice(0, 3).map(function (risk) {
        return risk.message;
      }),
      evaluation: evaluation,
      misclassification: buildMisclassificationLog(calibrationCase, evaluation)
    };
  });
  const labeledRows = rows.filter(function (row) { return Boolean(row.expectedGrade); });
  const consistentCount = labeledRows.filter(function (row) { return row.consistent; }).length;
  const overestimatedCount = rows.filter(function (row) { return row.direction === "高估"; }).length;
  const underestimatedCount = rows.filter(function (row) { return row.direction === "低估"; }).length;
  const typeStats = Object.keys(typeMap).map(function (key) {
    const item = typeMap[key];
    item.errorRate = item.labeled ? Math.round(item.misclassified / item.labeled * 100) : 0;
    return item;
  });
  const logs = rows.map(function (row) { return row.misclassification; }).filter(Boolean);
  const misclassificationSummary = buildMisclassificationSummary(rows, logs);
  return {
    version: SCORING_CONFIG.version,
    generatedAt: new Date().toISOString(),
    source: calibrationOptions.source || "builtin",
    blindMode: Boolean(calibrationOptions.blindMode),
    revealed: !calibrationOptions.blindMode,
    rows: rows,
    summary: {
      total: rows.length,
      labeled: labeledRows.length,
      unlabeled: rows.length - labeledRows.length,
      consistent: consistentCount,
      consistencyRate: labeledRows.length
        ? Math.round(consistentCount / labeledRows.length * 100)
        : null,
      overestimated: overestimatedCount,
      underestimated: underestimatedCount,
      distribution: distribution,
      expectedDistribution: expectedDistribution
    },
    typeStats: typeStats,
    misclassificationSummary: misclassificationSummary,
    misclassificationLogs: logs
  };
}

function normalizeCaseTags(tags) {
  if (!Array.isArray(tags)) return [];
  return Array.from(new Set(tags.filter(function (tag) {
    return SCORING_CONFIG.calibration.tags.includes(tag);
  })));
}

function normalizeHumanReview(review) {
  const safe = review && typeof review === "object" && !Array.isArray(review) ? review : {};
  const reviewerGrade = String(safe.reviewerGrade || "").toUpperCase();
  const finalDecision = String(safe.finalDecision || "");
  return {
    reviewerGrade: SCORING_CONFIG.gradeOrder.includes(reviewerGrade) ? reviewerGrade : "",
    reviewerReason: String(safe.reviewerReason || "").trim(),
    finalDecision: SCORING_CONFIG.calibration.finalDecisions.includes(finalDecision)
      ? finalDecision
      : "",
    correctionNotes: String(safe.correctionNotes || "").trim(),
    ruleAdjustmentNeeded: safe.ruleAdjustmentNeeded === true
  };
}

function hydrateExternalCase(rawCase) {
  const safe = rawCase && typeof rawCase === "object" ? rawCase : {};
  const expectedGrade = SCORING_CONFIG.gradeOrder.includes(String(safe.expectedGrade || "").toUpperCase())
    ? String(safe.expectedGrade).toUpperCase()
    : "";
  const requestedStatus = SCORING_CONFIG.calibration.caseStatuses.includes(safe.status)
    ? safe.status
    : (expectedGrade ? "已标注" : "待标注");
  return Object.assign({}, safe, {
    expectedGrade: expectedGrade,
    tags: normalizeCaseTags(safe.tags),
    status: requestedStatus,
    humanReview: normalizeHumanReview(safe.humanReview),
    notes: String(safe.notes || "")
  });
}

function normalizeExternalCase(rawCase, existingCase) {
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error("案例必须是 JSON 对象");
  }
  const now = new Date().toISOString();
  const expectedGrade = String(rawCase.expectedGrade || "").toUpperCase();
  if (expectedGrade && !SCORING_CONFIG.gradeOrder.includes(expectedGrade)) {
    throw new Error("expectedGrade 必须为空或 A/B/C/D/E");
  }
  if (!rawCase.title || !String(rawCase.title).trim()) {
    throw new Error("案例标题不能为空");
  }
  if (!rawCase.inputData || typeof rawCase.inputData !== "object" || Array.isArray(rawCase.inputData)) {
    throw new Error("inputData 必须是研究计划对象");
  }
  if (!existingCase && rawCase.id && CALIBRATION_CASES.some(function (item) {
    return item.id === String(rawCase.id);
  })) {
    throw new Error("id 与内置案例冲突，请使用独立的外部案例 id");
  }
  const allowedTypes = SCORING_CONFIG.calibration.caseTypes;
  const caseType = allowedTypes.includes(rawCase.caseType) ? rawCase.caseType : "其他";
  const requestedStatus = SCORING_CONFIG.calibration.caseStatuses.includes(rawCase.status)
    ? rawCase.status
    : (expectedGrade ? "已标注" : "待标注");
  return {
    id: String(rawCase.id || (existingCase && existingCase.id) ||
      ("external-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7))),
    title: String(rawCase.title).trim(),
    caseType: caseType,
    expectedGrade: expectedGrade,
    expectedReason: String(rawCase.expectedReason || "").trim(),
    tags: normalizeCaseTags(rawCase.tags),
    status: requestedStatus,
    humanReview: normalizeHumanReview(rawCase.humanReview),
    inputData: Object.assign({}, rawCase.inputData),
    createdAt: existingCase && existingCase.createdAt
      ? existingCase.createdAt
      : String(rawCase.createdAt || now),
    updatedAt: now,
    notes: String(rawCase.notes || "").trim()
  };
}

function parseExternalCaseJson(jsonText, existingCases) {
  const parsed = JSON.parse(jsonText);
  const rawCases = Array.isArray(parsed) ? parsed : parsed.cases;
  if (!Array.isArray(rawCases)) {
    throw new Error("JSON 顶层必须是案例数组，或包含 cases 数组");
  }
  const caseMap = new Map((existingCases || []).map(function (item) {
    return [item.id, item];
  }));
  const imported = [];
  const errors = [];
  rawCases.forEach(function (rawCase, index) {
    try {
      const existing = rawCase.id ? caseMap.get(String(rawCase.id)) : null;
      const normalized = normalizeExternalCase(rawCase, existing);
      caseMap.set(normalized.id, normalized);
      imported.push(normalized);
    } catch (error) {
      errors.push("第 " + (index + 1) + " 个案例：" + error.message);
    }
  });
  return {
    cases: Array.from(caseMap.values()),
    imported: imported.length,
    errors: errors
  };
}

function exportExternalCasesJson(cases) {
  return JSON.stringify({
    version: SCORING_CONFIG.version,
    exportedAt: new Date().toISOString(),
    cases: cases || []
  }, null, 2);
}

function generateMarkdownReport(result) {
  const lines = [];
  const add = function (line) { lines.push(line); };
  add("# CommQuant 评估报告");
  add("");
  add("## 一、总判定");
  add("");
  add("诊断模式：" + result.modeName);
  add("");
  add("等级：" + result.finalGrade);
  add("");
  add("综合分：" + result.rawScore.toFixed(2) + " / 5");
  add("");
  add("一句话判断：" + result.verdict.oneLine);
  add("");
  add("评分可信度：" + result.confidence.level + "（" + result.confidence.score + "/100）");
  add("");
  add("可信度说明：" + result.confidence.reason);
  add("");
  add("研究设计完整度指数：" + result.designCompletenessScore + " / 100");
  add("");
  add("完整度解释：" + result.designCompleteness.level + "；" +
    result.designCompleteness.explanation);
  add("");
  if (result.designCompleteness.isInsufficient) {
    add("**" + result.designCompleteness.warning + "**");
    add("");
  }
  if (result.calibration) {
    add("测试案例校准：" + result.calibration.caseName + "；预期 " +
      result.calibration.expectedGrade + "，实际 " + result.calibration.actualGrade +
      "，" + (result.calibration.matched ? "校准一致" : "需要人工复核") + "。");
    add("");
    add("人工预期理由：" + result.calibration.expectedReason);
    add("");
  }
  add(result.verdict.rawNote + "。");
  add("");
  add("## 二、评分矩阵");
  add("");
  if (result.mode === "quick") {
    add("快速模式仅评估 10 个核心维度，不执行完整十九维方法与发表价值审计。");
    add("");
  }
  add("| 维度名称 | 分数 | 诊断 | 风险等级 |");
  add("| --- | ---: | --- | --- |");
  result.dimensions.forEach(function (item) {
    add("| " + item.name + " | " + item.score + " | " +
      item.diagnosis.replace(/\|/g, "｜").replace(/\n/g, " ") + " | " + item.risk + " |");
  });
  add("");
  add("### 五大轴心");
  add("");
  result.axes.forEach(function (axis) {
    add("- " + axis.name + "：" + axis.score.toFixed(2) + " / 5");
  });
  add("");
  add("### 问题—数据—变量—方法对应矩阵");
  add("");
  add("| 要素 | 提取内容 | 对应项 | 判断 |");
  add("| --- | --- | --- | --- |");
  result.alignment.rows.forEach(function (row) {
    add("| " + row.element + " | " +
      row.extracted.replace(/\|/g, "｜") + " | " +
      row.counterpart.replace(/\|/g, "｜") + " | " + row.status + " |");
  });
  add("");
  if (result.alignment.risks.length) {
    add("对应风险：");
    add("");
    result.alignment.risks.forEach(function (risk) {
      add("- " + risk.message);
    });
  } else {
    add("未发现预设的关键对应风险。");
  }
  add("");
  add("## 三、硬性降级触发项");
  add("");
  if (result.downgrades.length) {
    result.downgrades.forEach(function (item, index) {
      add((index + 1) + ". 规则 " + item.rule + "（最高 " + item.cap + "）：" + item.message);
    });
  } else {
    add("未触发硬性降级规则，但仍需关注以下方法风险。");
  }
  add("");
  const sectionMap = [
    ["## 四、研究问题诊断", "研究问题诊断"],
    ["## 五、数据诊断", "数据诊断"],
    ["## 六、研究对象—数据库匹配诊断", "研究对象—数据库匹配诊断"],
    ["## 七、变量诊断", "变量诊断"],
    ["## 八、方法诊断", "方法诊断"],
    ["## 九、证据—结论匹配诊断", "证据—结论匹配诊断"],
    ["## 十、CSSCI/SSCI 文献锚定诊断", "CSSCI/SSCI 文献锚定诊断"]
  ];
  sectionMap.forEach(function (section) {
    add(section[0]);
    add("");
    const diagnostic = result.diagnostics.find(function (item) { return item.title === section[1]; });
    add(diagnostic ? diagnostic.body : "暂无诊断。");
    add("");
  });
  add("## 十一、本地文献锚定匹配");
  add("");
  add(result.literatureAnchor.summary);
  add("");
  if (result.literatureAnchor.primary) {
    const primary = result.literatureAnchor.primary;
    add("匹配到的研究传统：" + primary.name);
    add("");
    add("匹配依据：" + (primary.basis.join("、") || "研究对象与方法结构"));
    add("");
    add("适合使用的变量：" + primary.suitableVariables.join("、"));
    add("");
    add("适合使用的方法：" + primary.suitableMethods.join("、"));
    add("");
    add("当前缺口：");
    add("");
    primary.gaps.forEach(function (gap) { add("- " + gap); });
    add("");
    add("需要补充的文献类型：");
    add("");
    primary.neededLiteratureTypes.forEach(function (item) { add("- " + item); });
    add("");
    add("传统内警示：");
    add("");
    primary.warnings.forEach(function (warning) { add("- " + warning); });
    add("");
  }
  add(result.literatureAnchor.disclaimer);
  add("");
  add("## 十二、审稿风险优先级");
  add("");
  ["fatal", "major", "general"].forEach(function (priority) {
    const items = result.reviewerRisks.filter(function (risk) {
      return risk.priority === priority;
    });
    if (!items.length) return;
    const label = priority === "fatal" ? "致命风险" : (priority === "major" ? "重大风险" : "一般风险");
    add("### " + label);
    add("");
    items.forEach(function (risk, index) {
      add((index + 1) + ". " + risk.message);
    });
    add("");
  });
  add("## 十三、修改路径");
  add("");
  result.revisionPath.forEach(function (item, index) {
    add((index + 1) + ". **" + item.title + "**：" + item.text);
  });
  add("");
  add("## 十四、最低可行研究设计（增强版）");
  add("");
  result.minimumDesign.forEach(function (item, index) {
    add((index + 1) + ". **" + item.label + "**：" + item.text);
  });
  add("");
  add("## 十五、规则审计摘要");
  add("");
  add("主要拉低维度：" + result.ruleAudit.loweringDimensions.join("、"));
  add("");
  add("主要支撑维度：" + result.ruleAudit.supportingDimensions.join("、"));
  add("");
  add("重复降级：" + result.ruleAudit.duplicateDowngrade.explanation);
  add("");
  add("输入不足：" + result.ruleAudit.insufficientInput.explanation);
  add("");
  add("方法硬降级：" + result.ruleAudit.methodHardDowngrade.explanation);
  add("");
  add("人工复核：" + result.ruleAudit.manualReview.explanation);
  add("");
  add("## 十六、规则追踪");
  add("");
  add("| 维度 | 基础分 | 调整后 | 匹配信号 | 缺失信号 | 调整原因 |");
  add("| --- | ---: | ---: | --- | --- | --- |");
  result.ruleTrace.dimensions.forEach(function (trace) {
    add("| " + trace.dimensionName + " | " + trace.baseScore + " | " +
      trace.adjustedScore + " | " + (trace.matchedSignals.join("、") || "无") +
      " | " + (trace.missingSignals.join("、") || "无") + " | " +
      (trace.penaltyReasons.concat(trace.boostReasons).join("；") || "无额外调整") + " |");
  });
  add("");
  add("原始均分：" + result.ruleTrace.gradeDecision.rawAverageScore +
    "；原始等级：" + result.ruleTrace.gradeDecision.rawGrade +
    "；最终等级：" + result.ruleTrace.gradeDecision.finalGrade + "。");
  add("");
  add(result.ruleTrace.gradeDecision.finalDecisionReason);
  add("");
  const triggeredRules = result.ruleTrace.hardRules.filter(function (rule) { return rule.triggered; });
  add("触发的硬性规则：" + (triggeredRules.length
    ? triggeredRules.map(function (rule) {
      return "规则 " + rule.ruleId + " " + rule.ruleName + "（最高 " + rule.gradeCap + "）";
    }).join("；")
    : "无") + "。");
  add("");
  add("## 十七、重复惩罚检测");
  add("");
  add("是否存在重复惩罚：" + (result.duplicatePenalties.exists ? "是" : "否"));
  add("");
  add("涉及的问题：" + (result.duplicatePenalties.issues.length
    ? result.duplicatePenalties.issues.map(function (item) { return item.problem; }).join("、")
    : "无"));
  add("");
  add("涉及维度：" + (result.duplicatePenalties.involvedDimensions.join("、") || "无"));
  add("");
  add("是否建议人工复核：" + (result.duplicatePenalties.manualReviewRecommended ? "是" : "否"));
  add("");
  add(result.duplicatePenalties.message);
  add("");
  add("## 十八、权重敏感性分析");
  add("");
  add("原始等级：" + result.weightSensitivity.originalGrade);
  add("");
  add("调整后最低等级：" + result.weightSensitivity.minGrade);
  add("");
  add("调整后最高等级：" + result.weightSensitivity.maxGrade);
  add("");
  add("稳定性：" + result.weightSensitivity.stabilityLabel);
  add("");
  add("最敏感轴心：" + result.weightSensitivity.mostSensitiveAxis);
  add("");
  add(result.weightSensitivity.explanation);
  add("");
  add("---");
  add("");
  add("本报告由 CommQuant 本地规则型引擎生成。它是研究设计前置诊断，不替代导师意见、真实文献核验或期刊审稿。");
  return lines.join("\n");
}

function findNamedItem(items, key, property) {
  const field = property || "title";
  return (items || []).find(function (item) { return item[field] === key; });
}

function generateAdvisorReport(result) {
  const lines = ["# CommQuant 导师沟通版", ""];
  const add = function (line) { lines.push(line); };
  add("## 选题总体判断");
  add("");
  add("等级：" + result.finalGrade + "；综合分：" + result.rawScore.toFixed(2) + " / 5；评分可信度：" + result.confidence.level + "。");
  add("");
  add(result.verdict.oneLine);
  add("");
  if (result.designCompleteness.isInsufficient) {
    add("**" + result.designCompleteness.warning + "**");
    add("");
  }
  add("## 主要问题");
  add("");
  result.reviewerRisks.slice(0, 5).forEach(function (risk, index) {
    add((index + 1) + ". " + risk.message);
  });
  if (!result.reviewerRisks.length) add("未发现预设的关键结构性风险。");
  add("");
  add("## 可保留部分");
  add("");
  const keep = findNamedItem(result.revisionPath, "可以保留什么");
  add(keep ? keep.text : "保留已经形成证据链的研究问题与变量设计。");
  add("");
  add("## 下一步修改方向");
  add("");
  result.revisionPath.filter(function (item) {
    return item.title !== "可以保留什么" && item.title !== "是否值得继续投入";
  }).slice(0, 5).forEach(function (item, index) {
    add((index + 1) + ". **" + item.title + "**：" + item.text);
  });
  add("");
  add("## 需要补充的数据、变量和文献");
  add("");
  const data = findNamedItem(result.revisionPath, "需要补充什么数据");
  const variables = findNamedItem(result.revisionPath, "需要重设哪些变量");
  add("- 数据：" + (data ? data.text : "补足与研究对象同层的证据。"));
  add("- 变量：" + (variables ? variables.text : "补足概念定义、编码规则与测量效度。"));
  add("- 文献：" + (result.literatureAnchor.primary
    ? "围绕“" + result.literatureAnchor.primary.name + "”补充经典、近五年实证与测量文献。"
    : "补充可核验的 CSSCI/SSCI 经典与近五年实证文献。"));
  add("");
  add("## 结论边界");
  add("");
  const boundary = findNamedItem(result.minimumDesign, "结论边界", "label");
  const maximum = findNamedItem(result.minimumDesign, "本研究最多能证明什么", "label");
  const cannot = findNamedItem(result.minimumDesign, "本研究不能证明什么", "label");
  add("- " + (boundary ? boundary.text : "结论限定于当前样本与分析单位。"));
  add("- 最多能证明：" + (maximum ? maximum.text : "当前样本中的统计关联。"));
  add("- 不能证明：" + (cannot ? cannot.text : "总体态度或未经识别的因果效应。"));
  return lines.join("\n");
}

function generateShowcaseReport(result) {
  const lines = ["# CommQuant 产品展示版", ""];
  const add = function (line) { lines.push(line); };
  add("## 输入摘要");
  add("");
  add("- 题目：" + (result.input.title || "未填写"));
  add("- 研究问题：" + truncateText(result.input.researchQuestions, 180));
  add("- 研究对象：" + truncateText(result.input.researchObject, 140));
  add("- 数据来源：" + truncateText(result.input.dataSource, 140));
  add("- 方法：" + truncateText(result.input.methods, 140));
  add("");
  add("## 系统评分");
  add("");
  add("- 模式：" + result.modeName);
  add("- 最终等级：" + result.finalGrade + "（原始等级 " + result.rawGrade + "）");
  add("- 综合分：" + result.rawScore.toFixed(2) + " / 5");
  add("- 评分可信度：" + result.confidence.level + "；设计完整度：" + result.designCompletenessScore + " / 100");
  result.axes.forEach(function (axis) { add("- " + axis.name + "：" + axis.score.toFixed(2)); });
  add("");
  add("## 触发规则");
  add("");
  if (result.downgrades.length) {
    result.downgrades.forEach(function (item) {
      add("- 规则 " + item.rule + "（最高 " + item.cap + "）：" + item.message);
    });
  } else add("- 未触发硬性降级规则。");
  add("");
  add("## 风险识别");
  add("");
  result.reviewerRisks.slice(0, 6).forEach(function (risk) {
    const label = risk.priority === "fatal" ? "致命" : (risk.priority === "major" ? "重大" : "一般");
    add("- [" + label + "] " + risk.message);
  });
  add("");
  add("## 修改建议");
  add("");
  result.revisionPath.slice(0, 6).forEach(function (item) {
    add("- **" + item.title + "**：" + item.text);
  });
  add("");
  add("## 校准说明");
  add("");
  add(result.calibration
    ? "本次输入来自校准案例“" + result.calibration.caseName + "”，人工预期 " +
      result.calibration.expectedGrade + "，系统输出 " + result.calibration.actualGrade + "。"
    : "本报告由 v" + result.version + " 本地规则引擎生成；支持案例校准、规则追踪、重复惩罚检测与权重敏感性分析。");
  add("");
  add("规则系统用于前置诊断，不替代导师意见、真实文献检索或期刊审稿。");
  return lines.join("\n");
}

function generateReportByMode(result, mode) {
  if (mode === "advisor") return generateAdvisorReport(result);
  if (mode === "showcase") return generateShowcaseReport(result);
  return generateMarkdownReport(result);
}

function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function collectFormInput() {
  const data = {};
  SCORING_CONFIG.fields.forEach(function (field) {
    const element = document.getElementById(field);
    data[field] = element ? element.value.trim() : "";
  });
  const selectedMode = document.querySelector('input[name="diagnosisMode"]:checked');
  data.diagnosisMode = selectedMode ? selectedMode.value : "full";
  const caseSelect = document.getElementById("test-case-select");
  data.testCaseId = caseSelect ? caseSelect.value : "";
  return data;
}

function populateForm(data) {
  SCORING_CONFIG.fields.forEach(function (field) {
    const element = document.getElementById(field);
    if (element) element.value = data && data[field] ? data[field] : "";
  });
  const mode = data && data.diagnosisMode === "quick" ? "quick" : "full";
  const modeControl = document.querySelector('input[name="diagnosisMode"][value="' + mode + '"]');
  if (modeControl) modeControl.checked = true;
  const caseSelect = document.getElementById("test-case-select");
  if (caseSelect) {
    caseSelect.value = data && data.testCaseId ? data.testCaseId : "";
    updateCaseExpected(caseSelect.value);
  }
  updateModeUI(mode);
  updateCompletedCount();
}

function updateCompletedCount() {
  const input = collectFormInput();
  const count = SCORING_CONFIG.fields.filter(function (field) {
    return normalizeText(input[field]).length > 0;
  }).length;
  document.getElementById("completed-count").textContent = String(count);
}

function saveInput() {
  try {
    localStorage.setItem(SCORING_CONFIG.storageKey, JSON.stringify(collectFormInput()));
    const status = document.getElementById("save-status");
    status.textContent = "已自动保存在本地";
    window.clearTimeout(saveInput.statusTimer);
    saveInput.statusTimer = window.setTimeout(function () {
      status.textContent = "输入将自动保存在本地";
    }, 1600);
  } catch (error) {
    document.getElementById("save-status").textContent = "浏览器未允许本地保存";
  }
}

function loadSavedState() {
  try {
    const savedInput = JSON.parse(localStorage.getItem(SCORING_CONFIG.storageKey) || "null");
    if (savedInput) populateForm(savedInput);
    const savedResult = JSON.parse(localStorage.getItem(SCORING_CONFIG.resultKey) || "null");
    if (savedResult && savedResult.version === SCORING_CONFIG.version &&
        savedResult.dimensions && savedResult.markdown) {
      renderResult(savedResult);
    }
  } catch (error) {
    localStorage.removeItem(SCORING_CONFIG.resultKey);
  }
}

function loadSavedCalibration() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCORING_CONFIG.calibrationKey) || "null");
    if (saved && saved.version === SCORING_CONFIG.version && saved.rows && saved.summary) {
      const scope = document.getElementById("calibration-scope");
      const blind = document.getElementById("blind-calibration");
      if (scope && ["builtin", "external", "all"].includes(saved.source)) scope.value = saved.source;
      if (blind) blind.checked = Boolean(saved.blindMode);
      renderCalibrationDashboard(saved);
      document.getElementById("run-calibration-btn").textContent = "重新运行校准";
    }
  } catch (error) {
    localStorage.removeItem(SCORING_CONFIG.calibrationKey);
  }
}

function renderAxes(axes) {
  document.getElementById("axis-bars").innerHTML = axes.map(function (axis) {
    const percentage = Math.max(0, Math.min(100, axis.score / 5 * 100));
    return '<div class="axis-row">' +
      '<div class="axis-meta"><strong>' + escapeHtml(axis.name) + '</strong><span>' +
      axis.score.toFixed(2) + ' / 5</span></div>' +
      '<div class="axis-track"><div class="axis-fill" style="width:' + percentage + '%"></div></div>' +
      '</div>';
  }).join("");
}

function renderMatrix(dimensions) {
  document.getElementById("score-matrix").innerHTML = dimensions.map(function (item) {
    const riskClass = item.risk === "低" ? "risk-low" : (item.risk === "中" ? "risk-medium" : "risk-high");
    return "<tr>" +
      "<td>" + escapeHtml(item.name) + "</td>" +
      '<td><span class="score-pill">' + item.score + " / 5</span></td>" +
      "<td>" + escapeHtml(item.diagnosis) + "</td>" +
      '<td><span class="risk-pill ' + riskClass + '">' + item.risk + "</span></td>" +
      "</tr>";
  }).join("");
}

function renderAlignment(alignment) {
  document.getElementById("alignment-matrix").innerHTML = alignment.rows.map(function (row) {
    const statusClass = row.status === "匹配"
      ? "match-good"
      : (row.status === "待补" ? "match-partial" : "match-bad");
    return "<tr>" +
      "<td>" + escapeHtml(row.element) + "</td>" +
      "<td>" + escapeHtml(row.extracted) + "</td>" +
      "<td>" + escapeHtml(row.counterpart) + "</td>" +
      '<td><span class="match-pill ' + statusClass + '">' + escapeHtml(row.status) + "</span></td>" +
      "</tr>";
  }).join("");
  const alerts = document.getElementById("alignment-alerts");
  if (!alignment.risks.length) {
    alerts.innerHTML = '<p class="alignment-alert alignment-clear">未发现预设的关键对应风险。</p>';
    return;
  }
  alerts.innerHTML = alignment.risks.map(function (risk) {
    return '<p class="alignment-alert">' + escapeHtml(risk.message) + "</p>";
  }).join("");
}

function renderPrioritizedRisks(risks) {
  const groups = [
    { id: "fatal", label: "致命风险", className: "priority-fatal" },
    { id: "major", label: "重大风险", className: "priority-major" },
    { id: "general", label: "一般风险", className: "priority-general" }
  ];
  const html = groups.map(function (group) {
    const items = risks.filter(function (risk) { return risk.priority === group.id; });
    if (!items.length) return "";
    return '<section class="priority-group ' + group.className + '">' +
      "<h4>" + group.label + "<span>" + items.length + " 项</span></h4>" +
      "<ol>" + items.map(function (risk) {
        return "<li>" + escapeHtml(risk.message) + "</li>";
      }).join("") + "</ol></section>";
  }).join("");
  document.getElementById("reviewer-risks").innerHTML = html ||
    '<section class="priority-group priority-general"><h4>一般风险<span>0 项</span></h4><p class="no-warning">未识别到预设审稿风险。</p></section>';
}

function renderDowngrades(downgrades) {
  const container = document.getElementById("downgrades");
  if (!downgrades.length) {
    container.innerHTML = '<p class="no-warning">未触发硬性降级规则，但仍需关注以下方法风险。</p>';
    return;
  }
  container.innerHTML = '<ol class="warning-list">' + downgrades.map(function (item) {
    return "<li><strong>规则 " + item.rule + " · 最高 " + item.cap + "</strong>：" +
      escapeHtml(item.message) + "</li>";
  }).join("") + "</ol>";
}

function renderDiagnostics(diagnostics) {
  document.getElementById("diagnostic-accordions").innerHTML = diagnostics.map(function (item, index) {
    return '<details class="diagnostic-item"' + (index === 0 ? " open" : "") + ">" +
      "<summary>" + escapeHtml(item.title) + "</summary>" +
      '<div class="diagnostic-body"><p>' + escapeHtml(item.body) + "</p></div>" +
      "</details>";
  }).join("");
}

function renderRevisionPath(path) {
  document.getElementById("revision-path").innerHTML = path.map(function (item) {
    return '<div class="revision-card"><h4>' + escapeHtml(item.title) + "</h4><p>" +
      escapeHtml(item.text) + "</p></div>";
  }).join("");
}

function renderMinimumDesign(design) {
  document.getElementById("minimum-design").innerHTML = design.map(function (item) {
    return '<div class="design-row"><strong>' + escapeHtml(item.label) + "</strong><span>" +
      escapeHtml(item.text) + "</span></div>";
  }).join("");
}

function renderDesignCompleteness(completeness) {
  document.getElementById("completeness-score").textContent = String(completeness.score);
  document.getElementById("completeness-fill").style.width = completeness.score + "%";
  document.getElementById("completeness-explanation").textContent =
    completeness.level + " · " + completeness.explanation;
  const warning = document.getElementById("completeness-warning");
  warning.textContent = completeness.warning;
  warning.classList.toggle("hidden", !completeness.isInsufficient);
}

function renderLiteratureAnchor(anchorResult) {
  const container = document.getElementById("literature-anchor-result");
  if (!anchorResult.primary) {
    container.innerHTML = '<div class="anchor-primary"><h4>未匹配到稳定研究传统</h4><p>' +
      escapeHtml(anchorResult.summary) + '</p></div><p class="anchor-disclaimer">' +
      escapeHtml(anchorResult.disclaimer) + "</p>";
    return;
  }
  const primary = anchorResult.primary;
  const list = function (items) {
    return "<ul>" + items.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  };
  container.innerHTML =
    '<div class="anchor-primary"><h4>' + escapeHtml(primary.name) + "</h4>" +
    "<p>" + escapeHtml(anchorResult.summary) + "</p>" +
    '<div class="anchor-detail-grid">' +
      '<div class="anchor-detail"><h5>匹配依据</h5><p>' +
        escapeHtml(primary.basis.join("、") || "研究对象与方法结构") + "</p></div>" +
      '<div class="anchor-detail"><h5>适合变量</h5><p>' +
        escapeHtml(primary.suitableVariables.join("、")) + "</p></div>" +
      '<div class="anchor-detail"><h5>适合方法</h5><p>' +
        escapeHtml(primary.suitableMethods.join("、")) + "</p></div>" +
      '<div class="anchor-detail"><h5>当前缺口</h5>' + list(primary.gaps) + "</div>" +
      '<div class="anchor-detail"><h5>需要补充的文献类型</h5>' +
        list(primary.neededLiteratureTypes) + "</div>" +
      '<div class="anchor-detail"><h5>传统内警示</h5>' + list(primary.warnings) + "</div>" +
    "</div></div>" +
    '<div class="anchor-matches">' + anchorResult.matches.map(function (item) {
      return '<span class="anchor-chip">' + escapeHtml(item.name) + " · " + item.score + "</span>";
    }).join("") + "</div>" +
    '<p class="anchor-disclaimer">' + escapeHtml(anchorResult.disclaimer) + "</p>";
}

function renderRuleAudit(audit) {
  const cards = [
    { title: "主要拉低维度", text: audit.loweringDimensions.join("、") },
    { title: "主要支撑维度", text: audit.supportingDimensions.join("、") },
    { title: "重复降级", text: audit.duplicateDowngrade.explanation },
    { title: "输入不足", text: audit.insufficientInput.explanation },
    { title: "方法硬降级", text: audit.methodHardDowngrade.explanation },
    { title: "人工复核", text: audit.manualReview.explanation, review: true }
  ];
  document.getElementById("rule-audit").innerHTML = cards.map(function (card) {
    return '<div class="audit-card' + (card.review ? " audit-review" : "") + '">' +
      "<h4>" + escapeHtml(card.title) + "</h4><p>" + escapeHtml(card.text) + "</p></div>";
  }).join("");
}

function renderRuleTrace(trace) {
  const rows = trace.dimensions.map(function (item) {
    return "<tr><td>" + escapeHtml(item.dimensionName) + "</td><td>" +
      item.baseScore + "</td><td>" + item.adjustedScore + "</td><td>" +
      escapeHtml(item.matchedSignals.join("、") || "无") + "</td><td>" +
      escapeHtml(item.missingSignals.join("、") || "无") + "</td><td>" +
      escapeHtml(item.penaltyReasons.join("；") || "无") + "</td><td>" +
      escapeHtml(item.boostReasons.join("；") || "无") + "</td></tr>";
  }).join("");
  const rules = trace.hardRules.map(function (rule) {
    return '<div class="trace-rule' + (rule.triggered ? " triggered" : "") + '">' +
      "规则 " + rule.ruleId + " · " + escapeHtml(rule.ruleName) + " · " +
      (rule.triggered ? "已触发，最高 " + rule.gradeCap + "：" + escapeHtml(rule.evidence) : "未触发") +
      "</div>";
  }).join("");
  document.getElementById("rule-trace").innerHTML =
    '<div class="trace-summary">' + escapeHtml(trace.gradeDecision.finalDecisionReason) + "</div>" +
    '<div class="table-wrap trace-table"><table><thead><tr><th>维度</th><th>基础分</th><th>调整后</th><th>匹配信号</th><th>缺失信号</th><th>扣分原因</th><th>加分原因</th></tr></thead><tbody>' +
    rows + '</tbody></table></div><div class="trace-rules">' + rules + "</div>";
}

function renderDuplicatePenalties(check) {
  document.getElementById("duplicate-penalties").innerHTML =
    '<div class="duplicate-card' + (check.exists ? " warning" : "") + '"><strong>' +
    (check.exists ? "发现可能的多重影响" : "未发现典型重复惩罚") + "</strong><p>" +
    escapeHtml(check.message) + "</p>" +
    (check.issues.length ? "<p>涉及问题：" + escapeHtml(check.issues.map(function (item) {
      return item.problem;
    }).join("、")) + "</p><p>涉及维度：" +
      escapeHtml(check.involvedDimensions.join("、")) + "</p>" : "") + "</div>";
}

function renderWeightSensitivity(sensitivity) {
  const container = document.getElementById("weight-sensitivity");
  if (!sensitivity.available) {
    container.innerHTML = '<div class="sensitivity-card"><strong>' +
      escapeHtml(sensitivity.stabilityLabel) + "</strong><p>" +
      escapeHtml(sensitivity.explanation) + "</p></div>";
    return;
  }
  container.innerHTML = '<div class="sensitivity-card"><div class="sensitivity-stats">' +
    [
      ["原始等级", sensitivity.originalGrade],
      ["调整后最低", sensitivity.minGrade],
      ["调整后最高", sensitivity.maxGrade],
      ["稳定性", sensitivity.stabilityLabel]
    ].map(function (item) {
      return '<div class="sensitivity-stat"><span>' + item[0] + "</span><strong>" +
        escapeHtml(item[1]) + "</strong></div>";
    }).join("") + "</div><p>最敏感轴心：" + escapeHtml(sensitivity.mostSensitiveAxis) +
    "</p><p>" + escapeHtml(sensitivity.explanation) + '</p><div class="sensitivity-variants">' +
    sensitivity.variants.map(function (item) {
      return '<span class="sensitivity-chip">' + escapeHtml(item.axisName.replace(/^轴心 [IVX]+：/, "")) +
        " " + item.adjustment + " → " + item.finalGrade + " / " + item.score + "</span>";
    }).join("") + "</div></div>";
}

function formatLocalTime(isoString) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(new Date(isoString));
  } catch (error) {
    return "";
  }
}

function renderResult(result) {
  window.currentEvaluation = result;
  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("result-content").classList.remove("hidden");
  const gradeBadge = document.getElementById("grade-badge");
  gradeBadge.textContent = result.finalGrade;
  gradeBadge.className = "grade-badge grade-" + result.finalGrade.toLowerCase();
  document.getElementById("total-score").textContent = Number(result.rawScore).toFixed(2);
  const confidenceBadge = document.getElementById("confidence-badge");
  confidenceBadge.textContent = result.confidence.level;
  confidenceBadge.className = "confidence-badge confidence-" +
    (result.confidence.level === "高" ? "high" : (result.confidence.level === "中" ? "medium" : "low"));
  document.getElementById("confidence-reason").textContent = result.confidence.reason;
  renderDesignCompleteness(result.designCompleteness);
  document.getElementById("mode-badge").textContent = result.modeName +
    (result.mode === "quick" ? " · 10 个核心维度" : " · 五大轴心 × 十九维");
  document.getElementById("one-line-verdict").textContent = result.verdict.oneLine;
  document.getElementById("continue-badge").textContent = result.verdict.invest;
  document.getElementById("raw-grade-note").textContent = result.verdict.rawNote;
  document.getElementById("result-time").textContent = "评估于 " + formatLocalTime(result.evaluatedAt);
  document.getElementById("axis-heading-title").textContent =
    result.mode === "quick" ? "快速诊断三项核心" : "五大轴心";
  document.getElementById("matrix-heading-title").textContent =
    result.mode === "quick" ? "快速诊断十维矩阵" : "十九维评分矩阵";
  renderAxes(result.axes);
  renderMatrix(result.dimensions);
  renderAlignment(result.alignment);
  renderDowngrades(result.downgrades);
  renderDiagnostics(result.diagnostics);
  renderLiteratureAnchor(result.literatureAnchor);
  renderPrioritizedRisks(result.reviewerRisks);
  renderRevisionPath(result.revisionPath);
  renderMinimumDesign(result.minimumDesign);
  renderRuleAudit(result.ruleAudit);
  renderRuleTrace(result.ruleTrace);
  renderDuplicatePenalties(result.duplicatePenalties);
  renderWeightSensitivity(result.weightSensitivity);
}

function runEvaluation() {
  const input = collectFormInput();
  const result = evaluatePaperWorthiness(input);
  renderResult(result);
  try {
    localStorage.setItem(SCORING_CONFIG.resultKey, JSON.stringify(result));
  } catch (error) {
    // 报告过大或禁用 localStorage 时不阻断核心评估。
  }
  if (window.innerWidth <= 1120) {
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    document.querySelector(".result-panel").scrollTo({ top: 0, behavior: "smooth" });
  }
}

function showActionFeedback(message, isError) {
  const feedback = document.getElementById("action-feedback");
  feedback.textContent = message;
  feedback.style.color = isError ? "var(--red)" : "var(--green)";
  window.clearTimeout(showActionFeedback.timer);
  showActionFeedback.timer = window.setTimeout(function () {
    feedback.textContent = "";
  }, 2200);
}

function renderCalibrationDashboard(calibrationResult) {
  window.currentCalibration = calibrationResult;
  const blindHidden = calibrationResult.blindMode && !calibrationResult.revealed;
  document.getElementById("calibration-empty").classList.add("hidden");
  document.getElementById("calibration-results").classList.remove("hidden");
  const summary = calibrationResult.summary;
  const stats = [
    { label: "总案例数", value: summary.total },
    { label: "已标注 / 待标注", value: summary.labeled + " / " + summary.unlabeled },
    { label: "一致案例数", value: blindHidden ? "—" : summary.consistent, className: "stat-good" },
    { label: "一致率", value: blindHidden ? "—" : (summary.consistencyRate === null ? "暂无" : summary.consistencyRate + "%"), className: "stat-good" },
    { label: "高估数量", value: blindHidden ? "—" : summary.overestimated, className: "stat-risk" },
    { label: "低估数量", value: blindHidden ? "—" : summary.underestimated, className: "stat-risk" }
  ];
  document.getElementById("calibration-stats").innerHTML = stats.map(function (item) {
    return '<div class="calibration-stat ' + (item.className || "") + '"><span>' +
      escapeHtml(item.label) + "</span><strong>" + escapeHtml(item.value) + "</strong></div>";
  }).join("");

  document.getElementById("calibration-distribution").innerHTML =
    SCORING_CONFIG.gradeOrder.map(function (grade) {
      return '<div class="grade-distribution-item"><span class="grade-' +
        grade.toLowerCase() + '">' + grade + "</span><strong>" +
        summary.distribution[grade] + "</strong></div>";
    }).join("");

  const longSummary = calibrationResult.misclassificationSummary;
  const summaryItems = [
    ["高估", blindHidden ? "—" : longSummary.overestimated],
    ["低估", blindHidden ? "—" : longSummary.underestimated],
    ["B/C 边界", longSummary.bcBoundary],
    ["C/D 边界", longSummary.cdBoundary],
    ["输入不足且低可信", longSummary.insufficientLowConfidence],
    ["重复惩罚复核", longSummary.duplicatePenaltyCases],
    ["常见降级", longSummary.mostCommonDowngrade.value + " × " + longSummary.mostCommonDowngrade.count],
    ["常见风险标签", longSummary.mostCommonRiskTag.value + " × " + longSummary.mostCommonRiskTag.count],
    ["常见误判原因", blindHidden ? "待揭示" : longSummary.mostCommonMisclassificationReason.value + " × " + longSummary.mostCommonMisclassificationReason.count]
  ];
  document.getElementById("misclassification-summary").innerHTML =
    summaryItems.map(function (item) {
      return '<div class="misclassification-summary-item"><span>' + escapeHtml(item[0]) +
        '</span><strong>' + escapeHtml(item[1]) + "</strong></div>";
    }).join("") + '<p class="summary-explanation">' +
      escapeHtml(longSummary.boundaryExplanation) + "</p>";

  document.getElementById("calibration-table-body").innerHTML =
    calibrationResult.rows.map(function (row) {
      const expectedCell = !row.expectedGrade
        ? '<span class="blind-hidden">待标注</span>'
        : (blindHidden
          ? '<span class="blind-hidden">已隐藏</span>'
          : '<span class="score-pill">' + row.expectedGrade + "</span>");
      const resultText = !row.expectedGrade
        ? "不计入"
        : (blindHidden ? "待揭示" : (row.consistent ? "一致" : row.direction));
      const resultClass = row.consistent === null
        ? "calibration-pending"
        : (row.consistent ? "calibration-ok" : "calibration-miss");
      const tagHtml = row.tags.length
        ? row.tags.map(function (tag) { return '<span class="table-tag">' + escapeHtml(tag) + "</span>"; }).join("")
        : '<span class="table-empty">—</span>';
      const mainRisk = row.mainRisks[0] || "无";
      return "<tr>" +
        '<td class="case-title-cell" title="' + escapeHtml(row.title) + '">' + escapeHtml(row.title) + "</td>" +
        "<td>" + escapeHtml(row.caseType) + "</td>" +
        '<td class="tag-cell">' + tagHtml + "</td>" +
        '<td><span class="status-pill">' + escapeHtml(row.status) + "</span></td>" +
        "<td>" + expectedCell + "</td>" +
        "<td><span class=\"score-pill\">" + row.actualGrade + "</span></td>" +
        "<td>" + row.rawScore.toFixed(2) + "</td>" +
        '<td class="' + resultClass + '">' + resultText + "</td>" +
        "<td>" + (!row.expectedGrade || blindHidden ? "—" : row.magnitude) + "</td>" +
        "<td>" + escapeHtml(row.downgradeRules.length ? row.downgradeRules.join("、") : "无") + "</td>" +
        '<td class="risk-compact" title="' + escapeHtml(row.mainRisks.join("；") || "无") + '">' +
          escapeHtml(truncateText(mainRisk, 86)) + "</td>" +
        "<td>" + escapeHtml(row.confidence) + "</td>" +
      "</tr>";
    }).join("");

  const revealButton = document.getElementById("reveal-expected-btn");
  revealButton.classList.toggle("hidden", !blindHidden);

  document.getElementById("calibration-type-stats").innerHTML =
    calibrationResult.typeStats.map(function (item) {
      return '<div class="type-stat-card"><h4>' + escapeHtml(item.caseType) +
        "</h4><p>案例 " + item.total + " · 已标注 " + item.labeled + (blindHidden
          ? " · 误判统计待揭示"
          : " · 误判 " + item.misclassified + " · 误判率 " + item.errorRate +
            "% · 高估 " + item.overestimated + " · 低估 " + item.underestimated) +
        "</p></div>";
    }).join("");

  const logContainer = document.getElementById("misclassification-log");
  if (blindHidden) {
    logContainer.innerHTML = '<p class="misclassification-empty">盲评模式尚未揭示人工预期等级，误判日志暂不显示。</p>';
  } else if (!calibrationResult.misclassificationLogs.length) {
    logContainer.innerHTML = '<p class="misclassification-empty">本轮校准未产生误判日志。</p>';
  } else {
    logContainer.innerHTML = calibrationResult.misclassificationLogs.map(function (log) {
      return '<article class="misclassification-log-card"><h4>' +
        escapeHtml(log.caseName) + " · " + escapeHtml(log.type) + "</h4>" +
        "<p>人工等级：" + log.humanGrade + "；系统等级：" + log.systemGrade +
        "；分歧幅度：" + log.magnitude + "</p>" +
        "<p>可能原因：" + escapeHtml(log.possibleReasons.join("、")) + "</p>" +
        "<p>建议调整：" + escapeHtml(log.suggestion) + "</p>" +
        '<ul class="correction-suggestions">' + log.ruleCorrectionSuggestions.map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        }).join("") + "</ul>" +
        '<div class="correction-entry"><input id="correction-note-' + escapeHtml(log.id) +
        '" placeholder="记录本次人工修正说明"><button type="button" class="button button-small button-secondary record-correction-btn" data-log-id="' +
        escapeHtml(log.id) + '">记录修正</button></div></article>';
    }).join("");
  }
  renderCorrectionRecords();
}

function runCalibrationDashboard() {
  const button = document.getElementById("run-calibration-btn");
  const scope = document.getElementById("calibration-scope").value;
  const externalCases = getExternalCases();
  const cases = scope === "external"
    ? externalCases
    : (scope === "all" ? CALIBRATION_CASES.concat(externalCases) : CALIBRATION_CASES);
  if (!cases.length) {
    showExternalCaseFeedback("当前范围没有可运行的案例，请先新增或导入外部案例。", true);
    return;
  }
  button.disabled = true;
  button.textContent = "校准运行中…";
  window.setTimeout(function () {
    const result = runCalibrationCases(cases, {
      source: scope,
      blindMode: document.getElementById("blind-calibration").checked
    });
    renderCalibrationDashboard(result);
    try {
      localStorage.setItem(SCORING_CONFIG.calibrationKey, JSON.stringify(result));
    } catch (error) {
      // localStorage 不可用时仍保留本次页面结果。
    }
    button.disabled = false;
    button.textContent = "重新运行校准";
  }, 20);
}

function formatMisclassificationLogs(logs) {
  if (!logs || !logs.length) return "本轮校准未产生误判日志。";
  return logs.map(function (log, index) {
    return [
      (index + 1) + ". " + log.caseName,
      "人工等级：" + log.humanGrade,
      "系统等级：" + log.systemGrade,
      "误判类型：" + log.type,
      "分歧幅度：" + log.magnitude,
      "可能原因：" + log.possibleReasons.join("、"),
      "建议调整方向：" + log.suggestion,
      "修正规则建议：" + log.ruleCorrectionSuggestions.join("；")
    ].join("\n");
  }).join("\n\n");
}

function getStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getExternalCases() {
  return getStoredArray(SCORING_CONFIG.externalCaseKey).map(hydrateExternalCase);
}

function saveExternalCases(cases) {
  saveStoredArray(SCORING_CONFIG.externalCaseKey, cases);
  renderExternalCases();
}

function getCorrectionRecords() {
  return getStoredArray(SCORING_CONFIG.correctionKey);
}

function showExternalCaseFeedback(message, isError) {
  const feedback = document.getElementById("external-case-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.style.color = isError ? "var(--red)" : "var(--green)";
}

function resetExternalCaseForm() {
  document.getElementById("external-case-form").reset();
  document.getElementById("external-case-id").value = "";
  document.getElementById("external-case-type").value = "真实研究计划";
  document.getElementById("external-case-status").value = "待标注";
  document.getElementById("external-case-grade").value = "";
  document.getElementById("reviewer-grade").value = "";
  document.getElementById("final-decision").value = "";
  showExternalCaseFeedback("");
}

function populateExternalCaseTypes() {
  document.getElementById("external-case-type").innerHTML =
    SCORING_CONFIG.calibration.caseTypes.map(function (type) {
      return '<option value="' + escapeHtml(type) + '">' + escapeHtml(type) + "</option>";
    }).join("");
  document.getElementById("external-case-status").innerHTML =
    SCORING_CONFIG.calibration.caseStatuses.map(function (status) {
      return '<option value="' + escapeHtml(status) + '">' + escapeHtml(status) + "</option>";
    }).join("");
  document.getElementById("external-case-tags").innerHTML =
    SCORING_CONFIG.calibration.tags.map(function (tag, index) {
      return '<label><input type="checkbox" name="externalCaseTag" value="' +
        escapeHtml(tag) + '" id="case-tag-' + index + '"> ' + escapeHtml(tag) + "</label>";
    }).join("");
  document.getElementById("real-case-template").textContent =
    JSON.stringify(REAL_CASE_JSON_TEMPLATE, null, 2);
}

function renderExternalCases() {
  const cases = getExternalCases();
  const body = document.getElementById("external-case-table-body");
  if (!cases.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty-table-cell">尚无外部案例。</td></tr>';
    return;
  }
  body.innerHTML = cases.slice().sort(function (a, b) {
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  }).map(function (item) {
    const tags = item.tags.length
      ? item.tags.map(function (tag) { return '<span class="table-tag">' + escapeHtml(tag) + "</span>"; }).join("")
      : '<span class="table-empty">—</span>';
    const review = item.humanReview || normalizeHumanReview({});
    const reviewText = [review.reviewerGrade, review.finalDecision].filter(Boolean).join(" / ") || "未复核";
    return '<tr><td class="case-title-cell" title="' + escapeHtml(item.title) + '">' +
      escapeHtml(item.title) + "</td><td>" + escapeHtml(item.caseType) +
      '</td><td class="tag-cell">' + tags + '</td><td><span class="status-pill">' +
      escapeHtml(item.status) + "</span></td><td>" +
      (item.expectedGrade ? '<span class="score-pill">' + escapeHtml(item.expectedGrade) + "</span>" : "待标注") +
      "</td><td>" + escapeHtml(reviewText) + "</td><td>" +
      escapeHtml(formatLocalTime(item.updatedAt)) + "</td><td>" +
      '<div class="external-case-actions"><button type="button" class="button button-small button-ghost edit-external-case" data-case-id="' +
      escapeHtml(item.id) + '">编辑</button><button type="button" class="button button-small button-danger delete-external-case" data-case-id="' +
      escapeHtml(item.id) + '">删除</button></div></td></tr>';
  }).join("");
}

function submitExternalCase(event) {
  event.preventDefault();
  const cases = getExternalCases();
  const id = document.getElementById("external-case-id").value;
  const existing = cases.find(function (item) { return item.id === id; });
  try {
    const inputData = JSON.parse(document.getElementById("external-case-input").value || "{}");
    const tags = Array.from(document.querySelectorAll('#external-case-tags input[name="externalCaseTag"]:checked')).map(function (input) {
      return input.value;
    });
    const normalized = normalizeExternalCase({
      id: id || undefined,
      title: document.getElementById("external-case-title").value,
      caseType: document.getElementById("external-case-type").value,
      expectedGrade: document.getElementById("external-case-grade").value,
      expectedReason: document.getElementById("external-case-reason").value,
      tags: tags,
      status: document.getElementById("external-case-status").value,
      humanReview: {
        reviewerGrade: document.getElementById("reviewer-grade").value,
        reviewerReason: document.getElementById("reviewer-reason").value,
        finalDecision: document.getElementById("final-decision").value,
        correctionNotes: document.getElementById("correction-notes").value,
        ruleAdjustmentNeeded: document.getElementById("rule-adjustment-needed").checked
      },
      notes: document.getElementById("external-case-notes").value,
      inputData: inputData
    }, existing);
    const nextCases = existing
      ? cases.map(function (item) { return item.id === existing.id ? normalized : item; })
      : cases.concat(normalized);
    saveExternalCases(nextCases);
    resetExternalCaseForm();
    showExternalCaseFeedback(existing ? "案例已更新并保存到本地。" : "案例已新增并保存到本地。");
  } catch (error) {
    showExternalCaseFeedback("保存失败：" + error.message, true);
  }
}

function editExternalCase(caseId) {
  const item = getExternalCases().find(function (entry) { return entry.id === caseId; });
  if (!item) return;
  document.getElementById("external-case-id").value = item.id;
  document.getElementById("external-case-title").value = item.title;
  document.getElementById("external-case-type").value = item.caseType;
  document.getElementById("external-case-status").value = item.status;
  document.getElementById("external-case-grade").value = item.expectedGrade;
  document.getElementById("external-case-reason").value = item.expectedReason;
  document.getElementById("external-case-notes").value = item.notes;
  document.querySelectorAll('#external-case-tags input[name="externalCaseTag"]').forEach(function (input) {
    input.checked = item.tags.includes(input.value);
  });
  document.getElementById("reviewer-grade").value = item.humanReview.reviewerGrade;
  document.getElementById("reviewer-reason").value = item.humanReview.reviewerReason;
  document.getElementById("final-decision").value = item.humanReview.finalDecision;
  document.getElementById("correction-notes").value = item.humanReview.correctionNotes;
  document.getElementById("rule-adjustment-needed").checked = item.humanReview.ruleAdjustmentNeeded;
  document.getElementById("external-case-input").value = JSON.stringify(item.inputData, null, 2);
  showExternalCaseFeedback("正在编辑：" + item.title);
  document.getElementById("external-case-form").scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteExternalCase(caseId) {
  const cases = getExternalCases();
  const item = cases.find(function (entry) { return entry.id === caseId; });
  if (!item || !window.confirm("确认删除外部案例“" + item.title + "”？")) return;
  saveExternalCases(cases.filter(function (entry) { return entry.id !== caseId; }));
  resetExternalCaseForm();
  showExternalCaseFeedback("案例已删除。", false);
}

function importExternalCases() {
  const input = document.getElementById("external-case-import");
  try {
    const result = parseExternalCaseJson(input.value, getExternalCases());
    saveExternalCases(result.cases);
    input.value = "";
    const suffix = result.errors.length ? "；跳过 " + result.errors.length + " 个：" + result.errors.join("；") : "";
    showExternalCaseFeedback("已导入或更新 " + result.imported + " 个案例" + suffix, result.errors.length > 0);
  } catch (error) {
    showExternalCaseFeedback("导入失败：" + error.message, true);
  }
}

function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function exportExternalCases() {
  downloadTextFile(
    "\ufeff" + exportExternalCasesJson(getExternalCases()),
    "CommQuant-外部案例库-" + new Date().toISOString().slice(0, 10) + ".json",
    "application/json;charset=utf-8"
  );
  showExternalCaseFeedback("外部案例库 JSON 已导出。", false);
}

function saveCorrectionRecord(logId) {
  if (!window.currentCalibration || !window.currentCalibration.revealed) return;
  const log = window.currentCalibration.misclassificationLogs.find(function (item) {
    return item.id === logId;
  });
  if (!log) return;
  const noteElement = document.getElementById("correction-note-" + logId);
  const note = noteElement ? noteElement.value.trim() : "";
  if (!note) {
    document.getElementById("misclassification-feedback").textContent = "请先填写人工修正说明。";
    return;
  }
  const records = getCorrectionRecords();
  records.unshift({
    id: "correction-" + Date.now(),
    caseId: log.id,
    caseName: log.caseName,
    humanGrade: log.humanGrade,
    systemGrade: log.systemGrade,
    misclassificationType: log.type,
    ruleCorrectionSuggestions: log.ruleCorrectionSuggestions,
    note: note,
    createdAt: new Date().toISOString()
  });
  saveStoredArray(SCORING_CONFIG.correctionKey, records);
  if (noteElement) noteElement.value = "";
  renderCorrectionRecords();
  document.getElementById("misclassification-feedback").textContent = "修正记录已保存到本地。";
}

function renderCorrectionRecords() {
  const container = document.getElementById("correction-records");
  if (!container) return;
  const records = getCorrectionRecords();
  if (!records.length) {
    container.innerHTML = '<p class="misclassification-empty">尚无人工修正记录。</p>';
    return;
  }
  container.innerHTML = records.slice(0, 20).map(function (record) {
    return '<article class="correction-record"><strong>' + escapeHtml(record.caseName) +
      " · " + escapeHtml(record.misclassificationType) + "</strong><span>" +
      escapeHtml(record.humanGrade + " → " + record.systemGrade + " · " + formatLocalTime(record.createdAt)) +
      "</span><p>" + escapeHtml(record.note) + "</p></article>";
  }).join("");
}

function revealCalibrationExpected() {
  if (!window.currentCalibration) return;
  window.currentCalibration.revealed = true;
  renderCalibrationDashboard(window.currentCalibration);
  try {
    localStorage.setItem(SCORING_CONFIG.calibrationKey, JSON.stringify(window.currentCalibration));
  } catch (error) {
    // 盲评揭示在当前页面仍然生效。
  }
}

function calibrationExportRows(result) {
  const hidden = result.blindMode && !result.revealed;
  return result.rows.map(function (row) {
    return {
      id: row.id,
      title: row.title,
      caseType: row.caseType,
      tags: row.tags.join("；"),
      status: row.status,
      expectedGrade: hidden && row.expectedGrade ? "" : row.expectedGrade,
      actualGrade: row.actualGrade,
      matchStatus: !row.expectedGrade ? "待标注" : (hidden ? "待揭示" : (row.consistent ? "一致" : row.direction)),
      differenceMagnitude: !row.expectedGrade || hidden ? "" : row.magnitude,
      confidenceLevel: row.confidence,
      designCompletenessScore: row.designCompletenessScore,
      triggeredDowngrades: row.downgradeRules.join("；"),
      fatalRisksCount: row.fatalRisksCount,
      majorRisksCount: row.majorRisksCount,
      minorRisksCount: row.minorRisksCount,
      misclassificationType: !row.expectedGrade || hidden ? "" : (row.consistent ? "" : row.direction)
    };
  });
}

function csvCell(value) {
  return '"' + String(value === undefined || value === null ? "" : value).replace(/"/g, '""') + '"';
}

function buildCalibrationJsonPayload(result) {
  const hidden = result.blindMode && !result.revealed;
  const auditSummary = hidden ? Object.assign({}, result.misclassificationSummary, {
    overestimated: null,
    underestimated: null,
    mostCommonMisclassificationReason: { value: "待揭示", count: 0 }
  }) : result.misclassificationSummary;
  const payload = {
    version: result.version,
    generatedAt: result.generatedAt,
    source: result.source,
    blindMode: result.blindMode,
    expectedGradesRevealed: result.revealed,
    summary: hidden ? { total: result.summary.total } : result.summary,
    typeStats: hidden ? [] : result.typeStats,
    misclassificationSummary: auditSummary,
    rows: calibrationExportRows(result)
  };
  return payload;
}

function exportCalibrationJson() {
  if (!window.currentCalibration) return;
  downloadTextFile("\ufeff" + JSON.stringify(buildCalibrationJsonPayload(window.currentCalibration), null, 2),
    "CommQuant-校准结果.json", "application/json;charset=utf-8");
}

function generateCalibrationCsv(result) {
  const headers = [
    "id", "title", "caseType", "tags", "status", "expectedGrade", "actualGrade", "matchStatus",
    "differenceMagnitude", "confidenceLevel", "designCompletenessScore",
    "triggeredDowngrades", "fatalRisksCount", "majorRisksCount", "minorRisksCount",
    "misclassificationType"
  ];
  const rows = calibrationExportRows(result);
  return [headers.map(csvCell).join(",")].concat(rows.map(function (row) {
    return headers.map(function (header) { return csvCell(row[header]); }).join(",");
  })).join("\r\n");
}

function exportCalibrationCsv() {
  if (!window.currentCalibration) return;
  downloadTextFile("\ufeff" + generateCalibrationCsv(window.currentCalibration),
    "CommQuant-校准结果.csv", "text/csv;charset=utf-8");
}

function generateCalibrationMarkdown(result) {
  const hidden = result.blindMode && !result.revealed;
  const lines = [
    "# CommQuant 校准报告", "",
    "版本：v" + result.version, "",
    "案例范围：" + result.source, "",
    "盲评模式：" + (result.blindMode ? "是" : "否") + "；人工预期等级：" +
      (hidden ? "尚未揭示" : "已显示"), "",
    "总案例数：" + result.summary.total, ""
  ];
  if (!hidden) {
    lines.push("已标注：" + result.summary.labeled + "；待标注：" + result.summary.unlabeled, "",
      "一致率：" + (result.summary.consistencyRate === null ? "暂无" : result.summary.consistencyRate + "%"), "", "高估：" +
      result.summary.overestimated + "；低估：" + result.summary.underestimated, "");
  }
  const summary = result.misclassificationSummary;
  lines.push("## 误判统计摘要", "",
    "- B/C 边界案例：" + summary.bcBoundary,
    "- C/D 边界案例：" + summary.cdBoundary,
    "- 输入不足且低可信度：" + summary.insufficientLowConfidence,
    "- 触发重复惩罚复核：" + summary.duplicatePenaltyCases,
    "- 最常见降级：" + summary.mostCommonDowngrade.value + " × " + summary.mostCommonDowngrade.count,
    "- 最常见风险标签：" + summary.mostCommonRiskTag.value + " × " + summary.mostCommonRiskTag.count,
    "- 最常见误判原因：" + (hidden ? "待揭示" : summary.mostCommonMisclassificationReason.value + " × " + summary.mostCommonMisclassificationReason.count),
    "", "## 案例结果", "", "| 案例 | 类型 | 标签 | 状态 | 人工等级 | 系统等级 | 分数 | 结果 | 完整度 | 降级项 |", "| --- | --- | --- | --- | --- | --- | ---: | --- | ---: | --- |");
  result.rows.forEach(function (row) {
    const expected = !row.expectedGrade ? "待标注" : (hidden ? "已隐藏" : row.expectedGrade);
    const match = !row.expectedGrade ? "不计入" : (hidden ? "待揭示" : (row.consistent ? "一致" : row.direction));
    lines.push("| " + row.title.replace(/\|/g, "｜") + " | " + row.caseType + " | " +
      (row.tags.join("、") || "无") + " | " + row.status + " | " + expected + " | " + row.actualGrade + " | " +
      row.rawScore.toFixed(2) + " | " + match +
      " | " + row.designCompletenessScore + " | " + (row.downgradeRules.join("；") || "无") + " |");
  });
  if (!hidden) {
    lines.push("", "## 误判日志", "", formatMisclassificationLogs(result.misclassificationLogs));
  }
  lines.push("", "---", "", "本报告由本地规则引擎生成；盲评未揭示时不会导出人工等级与误判结论。");
  return lines.join("\n");
}

function downloadCalibrationMarkdown() {
  if (!window.currentCalibration) return;
  downloadTextFile("\ufeff" + generateCalibrationMarkdown(window.currentCalibration), "CommQuant-校准报告.md", "text/markdown;charset=utf-8");
}

function copyMisclassificationLogs() {
  const calibration = window.currentCalibration;
  const hidden = calibration && calibration.blindMode && !calibration.revealed;
  const text = hidden
    ? "盲评模式尚未揭示人工预期等级，误判日志暂不可复制。"
    : formatMisclassificationLogs(calibration ? calibration.misclassificationLogs : []);
  const feedback = document.getElementById("misclassification-feedback");
  const success = function () {
    feedback.textContent = "误判日志已复制";
  };
  const fallback = function () {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("copy failed");
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(success).catch(function () {
      try { fallback(); success(); } catch (error) { feedback.textContent = "复制失败"; }
    });
  } else {
    try { fallback(); success(); } catch (error) { feedback.textContent = "复制失败"; }
  }
}

function copyRealCaseTemplate() {
  const text = JSON.stringify(REAL_CASE_JSON_TEMPLATE, null, 2);
  const success = function () {
    showExternalCaseFeedback("真实样本 JSON 模板已复制。", false);
  };
  const fallback = function () {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("copy failed");
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(success).catch(function () {
      try { fallback(); success(); } catch (error) {
        showExternalCaseFeedback("模板复制失败，请直接选择模板文本。", true);
      }
    });
  } else {
    try { fallback(); success(); } catch (error) {
      showExternalCaseFeedback("模板复制失败，请直接选择模板文本。", true);
    }
  }
}

function copyReport() {
  if (!window.currentEvaluation) return;
  const mode = document.getElementById("report-mode").value;
  const report = generateReportByMode(window.currentEvaluation, mode);
  const modeName = SCORING_CONFIG.reportModes[mode] || SCORING_CONFIG.reportModes.full;
  const fallbackCopy = function () {
    const textarea = document.createElement("textarea");
    textarea.value = report;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!success) throw new Error("copy failed");
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(report)
      .then(function () { showActionFeedback(modeName + "已复制"); })
      .catch(function () {
        try {
          fallbackCopy();
          showActionFeedback(modeName + "已复制");
        } catch (error) {
          showActionFeedback("复制失败，请使用下载功能", true);
        }
      });
  } else {
    try {
      fallbackCopy();
      showActionFeedback(modeName + "已复制");
    } catch (error) {
      showActionFeedback("复制失败，请使用下载功能", true);
    }
  }
}

function downloadReport() {
  if (!window.currentEvaluation) return;
  const mode = document.getElementById("report-mode").value;
  const modeName = SCORING_CONFIG.reportModes[mode] || SCORING_CONFIG.reportModes.full;
  const report = generateReportByMode(window.currentEvaluation, mode);
  const title = normalizeText(window.currentEvaluation.input.title) || "未命名研究";
  const safeName = title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 42);
  const blob = new Blob(["\ufeff" + report], {
    type: "text/markdown;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "CommQuant-" + modeName + "-" + safeName + ".md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  showActionFeedback("Markdown 报告已生成");
}

function updateModeUI(mode) {
  const safeMode = mode === "quick" ? "quick" : "full";
  const form = document.getElementById("research-form");
  if (form) form.classList.toggle("quick-mode", safeMode === "quick");
  const help = document.getElementById("mode-help");
  if (help) {
    help.textContent = safeMode === "quick"
      ? "快速模式：只使用 9 个关键输入字段评估 10 个核心维度；隐藏字段不会参与评分。"
      : "完整模式：建议填写全部 20 项，以提高评分可信度。";
  }
}

function populateTestCaseOptions() {
  const select = document.getElementById("test-case-select");
  TEST_CASES.forEach(function (testCase) {
    const option = document.createElement("option");
    option.value = testCase.id;
    option.textContent = testCase.name + " · 预期 " + testCase.expectedGrade;
    select.appendChild(option);
  });
}

function updateCaseExpected(caseId) {
  const label = document.getElementById("case-expected");
  if (!label) return;
  const testCase = TEST_CASES.find(function (item) { return item.id === caseId; });
  label.textContent = testCase
    ? "人工校准预期：" + testCase.expectedGrade
    : "";
}

function loadTestCase(caseId) {
  const testCase = TEST_CASES.find(function (item) { return item.id === caseId; });
  if (!testCase) return;
  window.isLoadingTestCase = true;
  const plan = Object.assign({}, testCase.plan, { testCaseId: testCase.id });
  populateForm(plan);
  const select = document.getElementById("test-case-select");
  select.value = testCase.id;
  updateCaseExpected(testCase.id);
  saveInput();
  document.getElementById("save-status").textContent =
    "已加载 " + testCase.name + "（预期 " + testCase.expectedGrade + "）";
  window.isLoadingTestCase = false;
}

function clearTestCaseCalibration() {
  const select = document.getElementById("test-case-select");
  if (select && select.value) {
    select.value = "";
    updateCaseExpected("");
  }
}

function clearAll() {
  populateForm({ diagnosisMode: "full" });
  clearTestCaseCalibration();
  localStorage.removeItem(SCORING_CONFIG.storageKey);
  localStorage.removeItem(SCORING_CONFIG.resultKey);
  window.currentEvaluation = null;
  document.getElementById("result-content").classList.add("hidden");
  document.getElementById("empty-state").classList.remove("hidden");
  document.getElementById("save-status").textContent = "输入已清空";
  document.getElementById("title").focus();
}

function debounce(fn, wait) {
  let timer;
  return function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, wait);
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("research-form");
  const handleInput = debounce(function () {
    updateCompletedCount();
    saveInput();
  }, 350);
  populateTestCaseOptions();
  populateExternalCaseTypes();
  resetExternalCaseForm();
  renderExternalCases();
  renderCorrectionRecords();
  form.addEventListener("input", function () {
    if (!window.isLoadingTestCase) clearTestCaseCalibration();
  });
  form.addEventListener("input", handleInput);
  document.querySelectorAll('input[name="diagnosisMode"]').forEach(function (control) {
    control.addEventListener("change", function () {
      updateModeUI(control.value);
      clearTestCaseCalibration();
      saveInput();
    });
  });
  document.getElementById("test-case-select").addEventListener("change", function (event) {
    if (event.target.value) {
      loadTestCase(event.target.value);
    } else {
      updateCaseExpected("");
    }
  });
  document.getElementById("evaluate-btn").addEventListener("click", runEvaluation);
  document.getElementById("example-btn").addEventListener("click", function () {
    loadTestCase("case-b1");
  });
  document.getElementById("clear-btn").addEventListener("click", clearAll);
  document.getElementById("copy-btn").addEventListener("click", copyReport);
  document.getElementById("download-btn").addEventListener("click", downloadReport);
  document.getElementById("run-calibration-btn").addEventListener("click", runCalibrationDashboard);
  document.getElementById("copy-misclassification-btn").addEventListener("click", copyMisclassificationLogs);
  document.getElementById("reveal-expected-btn").addEventListener("click", revealCalibrationExpected);
  document.getElementById("export-calibration-json-btn").addEventListener("click", exportCalibrationJson);
  document.getElementById("export-calibration-csv-btn").addEventListener("click", exportCalibrationCsv);
  document.getElementById("download-calibration-md-btn").addEventListener("click", downloadCalibrationMarkdown);
  document.getElementById("external-case-form").addEventListener("submit", submitExternalCase);
  document.getElementById("external-case-grade").addEventListener("change", function (event) {
    if (!event.target.value) document.getElementById("external-case-status").value = "待标注";
  });
  document.getElementById("cancel-external-edit-btn").addEventListener("click", resetExternalCaseForm);
  document.getElementById("import-external-cases-btn").addEventListener("click", importExternalCases);
  document.getElementById("export-external-cases-btn").addEventListener("click", exportExternalCases);
  document.getElementById("copy-real-case-template-btn").addEventListener("click", copyRealCaseTemplate);
  document.getElementById("external-case-table-body").addEventListener("click", function (event) {
    const editButton = event.target.closest(".edit-external-case");
    const deleteButton = event.target.closest(".delete-external-case");
    if (editButton) editExternalCase(editButton.dataset.caseId);
    if (deleteButton) deleteExternalCase(deleteButton.dataset.caseId);
  });
  document.getElementById("misclassification-log").addEventListener("click", function (event) {
    const button = event.target.closest(".record-correction-btn");
    if (button) saveCorrectionRecord(button.dataset.logId);
  });
  loadSavedState();
  loadSavedCalibration();
  updateCompletedCount();
});

// 预留给后续 AI 接口层或单元测试使用，不发送任何网络请求。
window.CommQuant = {
  config: SCORING_CONFIG,
  literatureAnchorLibrary: LITERATURE_ANCHOR_LIBRARY,
  example: EXAMPLE_RESEARCH_PLAN,
  testCases: TEST_CASES,
  calibrationCases: CALIBRATION_CASES,
  realCaseJsonTemplate: REAL_CASE_JSON_TEMPLATE,
  evaluatePaperWorthiness: evaluatePaperWorthiness,
  runCalibrationCases: runCalibrationCases,
  calculateDesignCompleteness: calculateDesignCompleteness,
  matchLiteratureAnchors: matchLiteratureAnchors,
  buildRuleAudit: buildRuleAudit,
  generateMarkdownReport: generateMarkdownReport,
  generateAdvisorReport: generateAdvisorReport,
  generateShowcaseReport: generateShowcaseReport,
  generateReportByMode: generateReportByMode,
  buildConfidence: buildConfidence,
  buildAlignmentMatrix: buildAlignmentMatrix,
  detectDuplicatePenalties: detectDuplicatePenalties,
  analyzeWeightSensitivity: analyzeWeightSensitivity,
  buildMisclassificationSummary: buildMisclassificationSummary,
  normalizeExternalCase: normalizeExternalCase,
  normalizeHumanReview: normalizeHumanReview,
  hydrateExternalCase: hydrateExternalCase,
  parseExternalCaseJson: parseExternalCaseJson,
  exportExternalCasesJson: exportExternalCasesJson,
  generateCalibrationMarkdown: generateCalibrationMarkdown,
  generateCalibrationCsv: generateCalibrationCsv,
  buildCalibrationJsonPayload: buildCalibrationJsonPayload
};
