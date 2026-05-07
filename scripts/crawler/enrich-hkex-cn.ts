// H 股公司英文名 → 中文名 best-effort 补全
// 运行方式：npx tsx scripts/crawler/enrich-hkex-cn.ts
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

// 已知映射（手动维护，优先级最高）
// 覆盖 obvious 中文名、知名品牌、大型央企/民企
const MANUAL_MAP: Record<string, string> = {
  'Yusheng Holdings Limited': '域生控股',
  'Keytop Parking Inc.': '科拓停车',
  'Alebund Pharmaceuticals (Jiangsu) Limited': '礼邦医药（江苏）',
  'Hangzhou Qiandaohu Xunlong Sci-tech Co., Ltd.': '杭州千岛湖迅龙科技',
  'Jiangxi Institute of Biological Products Inc.': '江西生物制品研究所',
  'Zephyr Intelligent System (Shanghai) Co., Ltd.': '泽风智能系统（上海）',
  'Anhui Huaheng Biotechnology Co., Ltd.': '安徽华恒生物科技',
  'Junqi Holdings Limited': '俊奇控股',
  'Lalatech Holdings Limited': '货拉拉控股',
  'Proya Cosmetics Co., Ltd.': '珀莱雅化妆品',
  'Shanghai Newrank Info & Tech Co., Ltd.': '上海新榜信息科技',
  'Shantui Construction Machinery Co., Ltd.': '山推工程机械',
  'Sichuan Neautus Traditional Chinese Medicine Co., Ltd.': '四川新荷花中药饮片',
  'Long Macro New Material Group Limited': '龙宏新材料集团',
  'Dragon Mining Limited': '龙矿资源',
  'Jiangsu HSC New Energy Materials Co., Ltd.': '江苏华盛锂电新能源材料',
  'Nanjing Lingxing Technology Co., Ltd.': '南京领行科技',
  'NASN Intelligent Tech (Zhejiang) Co., Ltd.': '纳狮智能科技（浙江）',
  'Shanghai Buy Quickly BMax Technology Services Group Co., Ltd.': '上海百快BMax科技服务集团',
  'Shanghai Fullhan Microelectronics Co., Ltd.': '上海富瀚微电子',
  'Shenzhen Intellifusion Technologies Co., Ltd.': '深圳云天励飞技术',
  'Tanboer Group Co., Ltd.': '坦博尔集团',
  'Wecare Probiotics Co., Ltd.': '万益蓝益生菌',
  'Amos Food (Group) Co., Ltd.': '安慕斯食品集团',
  'Beijing Dynaflow Lab Solutions Co., Ltd.': '北京戴纳实验科技',
  'Colipu Technologies Group Co., Ltd.': '科利普科技集团',
  'Shenzhen Chuangzhi Semi-link Technology Co., Ltd.': '深圳创智半导体连接技术',
  'Shenzhen Inovance Technology Co., Ltd': '深圳汇川技术',
  'Wuhan Silicon Integrated Co., Ltd.': '武汉硅集成',
  'Chongqing Afari Technology Co., Ltd.': '重庆阿法里科技',
  'GEM Co., Ltd.': '格林美',
  'Guangzhou Ruoyuchen Technology Co., Ltd.': '广州若羽臣科技',
  'HGTECH Company Limited': '华工科技',
  'Befar Group Co., Ltd.': '滨化集团',
  'Beijing QL Biopharmaceutical Co., Ltd': '北京齐力生物制药',
  'Carraro China Drive Systems Co., Ltd.': '卡拉罗中国传动系统',
  'Horen Cortp Co., Ltd.': '好润集团',
  'Makesense Energy Technology Co., Limited': '美科新能源科技',
  'Sungrow Power Supply Co., Ltd.': '阳光电源',
  'WYBOTICS Co.,LTD': '望圆智能科技',
  'JVS (Suzhou) Technologies Co., Ltd.': '捷伟仕（苏州）科技',
  'Suzhou TFC Optical Communication Co., Ltd.': '苏州天孚光通信',
  'Beijing Yuanxin Technology Group Co., Ltd.': '北京远信科技集团',
  'Hunan Mingzhu Mining Chemical Technology Co., Ltd.': '湖南明珠矿业化工科技',
  'Shenzhen Camsense Technologies Co., Ltd.': '深圳欢创科技',
  'PCI Technology Group Co., Ltd.': '柏承科技集团',
  'WeiMai Inc.': '微脉科技',
  'Wuhan DR Laser Technology Corp., Ltd': '武汉帝尔激光科技',
  'Capital Securities Corporation Limited': '首都证券',
  'Binhui Biopharmaceutical Co., Ltd.': '宾惠生物医药',
  'Casstime Holdings Ltd.': '卡仕达控股',
  'PRM Technology Co., Ltd.': '普瑞姆科技',
  'Suzhou Canmax Technologies Limited': '苏州创迈科技',
  'Annoroad Gene Technology (Beijing) Co., Ltd.': '安诺优达基因科技（北京）',
  'VeriSilicon Microelectronics (Shanghai) Co., Ltd.': '芯原微电子（上海）',
  'Nova Insight Technology Limited': '星图洞察科技',
  'Semi-Tech Group Co., Ltd.': '世达科技集团',
  'Amlogic (Shanghai) Co.,Ltd.': '晶晨半导体（上海）',
  'Aqara International Ltd': '绿米联创国际',
  'Beijing Zhongke Wenge Science and Technology Co., Ltd.': '北京中科闻歌科技',
  'Huizhou Desay SV Automotive Co., Ltd.': '惠州德赛西威汽车电子',
  'Yeeper Nutrition Technology (Qingdao) Group Co., Ltd.': '一然益生菌营养科技（青岛）集团',
  'Boffotto Semiconductor Co., Ltd.': '博福托半导体',
  'Good Doctor Cloud Healthcare & Technology Group Co., Ltd.': '好医生云医疗科技集团',
  'Shenzhen Huafu Technology Co., Ltd.': '深圳华付技术',
  'Shenzhen Xiaokuo Technology Co., Ltd.': '深圳小阔科技',
  'Dajin Heavy Industry Co., Ltd.': '大金重工',
  'Qingtao (Kunshan) Energy Development Group Co., Ltd.': '清陶（昆山）能源发展集团',
  'Transwarp Technology (Shanghai) Co., Ltd.': '星环信息科技（上海）',
  'Wuhan Ammunition Life-tech Co., Ltd.': '武汉光谷生命科技',
  'Yuanjie Semiconductor Technology Co., Ltd.': '元杰半导体科技',
  'CHANDO GLOBAL HOLDING LIMITED': '自然堂全球控股',
  'Enginetech Computer Co., Ltd.': '英劲科技电脑',
  'Guangdong CHJ Industry Co., Ltd.': '广东潮宏基实业',
  'New Hope Dairy Co., Ltd.': '新希望乳业',
  'RIGOL Technologies Co., Ltd.': '普源精电科技',
  'Shanghai Huilun Pharmaceutical Co., Ltd.': '上海汇伦医药',
  'Shanghai Innovatech Information Technology Co., Ltd.': '上海 innovaTech 信息科技',
  'Streamax Technology Co., Ltd.': '锐明技术',
  'Suzhou UIGreen Micro&Nano Technologies Co., Ltd.': '苏州优一微纳科技',
  'Zhejiang Maoyuanchang Eyewear Co., Ltd.': '浙江毛源昌眼镜',
  'Shandong Baogai New Materials Technology Co., Ltd.': '山东宝盖新材料科技',
  'Milian Technology Inc.': '米联科技',
  'SG Micro Corp': '圣邦微电子',
  'Shenzhen Image Technology Co., Ltd.': '深圳影石创新科技',
  'Shida Shinghwa Advanced Material Group Co., Ltd.': '世达星华先进材料集团',
  'XREAL Ltd.': 'XREAL',
  'Alkaidsemi (Shanghai) Technologies Corporation': '瑶芯微（上海）科技',
  'Beijing Data Intelink Technology Co., Ltd.': '北京数据智能互联科技',
  'Changzhou Microintelligence Co., Ltd': '常州微亿智能科技',
};

async function main() {
  const hShares = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, 'h-shares.json'), 'utf8')
  ) as Array<{ name: string; nameEn?: string; nameCn?: string }>;

  let updated = 0;
  let skipped = 0;

  for (const c of hShares) {
    const en = c.nameEn || c.name;
    if (!en) continue;

    if (MANUAL_MAP[en]) {
      c.nameCn = MANUAL_MAP[en];
      updated++;
      continue;
    }

    // 已有中文名则跳过
    if (c.nameCn) {
      skipped++;
      continue;
    }

    skipped++;
  }

  await fs.writeFile(
    path.join(DATA_DIR, 'h-shares.json'),
    JSON.stringify(hShares, null, 2) + '\n',
    'utf8'
  );

  console.log(`✓ 完成：更新 ${updated} 条中文名，跳过 ${skipped} 条（暂无映射）`);
}

main().catch((err) => {
  console.error('enrich failed:', err);
  process.exit(1);
});
