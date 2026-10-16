import type { FeedFilter } from "../types/feed.schema";

export type ShowcaseTone = "basil" | "tomato" | "grain" | "beet" | "sage";

type ShowcaseAuthor = {
  name: string;
  handle: string;
  initials: string;
  tone: ShowcaseTone;
  verified?: boolean;
};

type ShowcaseStats = {
  comments: number;
  reposts: number;
  sprouts: number;
  views: number;
};

type ShowcaseBase = {
  id: string;
  publishedAt: string;
  author: ShowcaseAuthor;
  body: string;
  tags: string[];
  stats: ShowcaseStats;
};

export type ShowcasePost = ShowcaseBase & (
  | {
      kind: "video";
      video: { caption: string; duration: string; tone: ShowcaseTone };
    }
  | {
      kind: "article";
      article: { title: string; source: string; tone: ShowcaseTone };
    }
  | {
      kind: "photo";
      photos: { alt: string; tone: ShowcaseTone }[];
    }
);

const authors = {
  marcus: {
    name: "Đầu bếp Marcus Green",
    handle: "marcus_plantcraft",
    initials: "MG",
    tone: "basil",
    verified: true,
  },
  sarah: {
    name: "TS. Sarah Lin",
    handle: "sarahlin_nutrition",
    initials: "SL",
    tone: "sage",
    verified: true,
  },
  julian: {
    name: "Julian Gomez",
    handle: "julian_grows",
    initials: "JG",
    tone: "tomato",
  },
  kenji: {
    name: "Kenji Takahashi",
    handle: "kyoto_miso_lab",
    initials: "KT",
    tone: "beet",
    verified: true,
  },
  amara: {
    name: "Đầu bếp Amara Okafor",
    handle: "amara_cooks_green",
    initials: "AO",
    tone: "grain",
    verified: true,
  },
  noor: {
    name: "Noor Haddad",
    handle: "noor_bakes_plants",
    initials: "NH",
    tone: "grain",
  },
} satisfies Record<string, ShowcaseAuthor>;

/** Illustrative web content, not server records. Never attach post mutations. */
export const showcasePosts: ShowcasePost[] = [
  {
    id: "showcase-marcus",
    kind: "video",
    publishedAt: "2026-09-22T18:30:00Z",
    author: authors.marcus,
    body: "Bí quyết để đậu hũ giòn rụm không chỉ nằm ở bột bắp. Hãy luộc đậu trong nước muối trước, rồi ép ráo và áp chảo bằng dầu mè ép lạnh. Đây là hướng dẫn đầy đủ kèm sốt phủ maple-tahini vàng óng. Xem kỹ thuật nhé!",
    tags: ["BữaTối15Phút", "ĐậuHũ"],
    stats: { comments: 1200, reposts: 4800, sprouts: 14200, views: 212000 },
    video: { duration: "2:45", caption: "Video từng bước", tone: "grain" },
  },
  {
    id: "showcase-sarah",
    kind: "article",
    publishedAt: "2026-09-18T09:00:00Z",
    author: authors.sarah,
    body: "Vì sao kết hợp sắt non-heme với axit citric có thể tăng khả năng hấp thu ở tế bào lên tới 300%. Chúng tôi phân tích dữ liệu mới về rau họ cải lên men, việc khử phytate bằng cách ngâm, và các phương pháp duy trì sức khỏe bền vững.",
    tags: ["DinhDưỡng", "NghiênCứu"],
    stats: { comments: 342, reposts: 819, sprouts: 6100, views: 98400 },
    article: {
      title: "Kỹ thuật giảm phytate trên 12 loại ngũ cốc",
      source: "Cùng Nhóm Nghiên cứu Lâm sàng · 4 phút đọc",
      tone: "tomato",
    },
  },
  {
    id: "showcase-julian",
    kind: "photo",
    publishedAt: "2026-09-15T07:45:00Z",
    author: authors.julian,
    body: "Mẻ thu hoạch đầu tiên từ ban công căn hộ tầng 4! Cà chua gia truyền Cherokee Purple năm nay ngọt đậm. Mình giã cùng húng quế Genovese tươi và hạt thông rang để làm sốt pesto sống tươi mát. Còn ai trồng rau trong không gian nhỏ không?",
    tags: ["LàmVườnĐôThị"],
    stats: { comments: 189, reposts: 410, sprouts: 3900, views: 41700 },
    photos: [
      { alt: "Giỏ cà chua gia truyền", tone: "tomato" },
      { alt: "Sốt pesto húng quế trong cối", tone: "basil" },
    ],
  },
  {
    id: "showcase-kenji",
    kind: "video",
    publishedAt: "2026-09-13T12:10:00Z",
    author: authors.kenji,
    body: "Miso trắng làm nhanh bằng đậu gà thay cho đậu nành. Koji gạo, 6% muối và hơi ấm từ đèn lò nướng lo phần việc nặng. Mình cho xem kết cấu ở ngày thứ nhất, hai và ba để bạn biết thế nào là ‘đã xong’.",
    tags: ["LênMen", "Miso"],
    stats: { comments: 256, reposts: 1100, sprouts: 8700, views: 126000 },
    video: { duration: "6:12", caption: "Kỹ thuật", tone: "beet" },
  },
  {
    id: "showcase-amara",
    kind: "article",
    publishedAt: "2026-09-10T16:20:00Z",
    author: authors.amara,
    body: "Tảo kombu, nấm porcini khô, miso trắng và men dinh dưỡng rang, mỗi thứ mang một tầng vị umami khác nhau. Đây là cách tôi phối chúng qua một tuần phục vụ, và chỗ mỗi loại âm thầm thất bại.",
    tags: ["GhiChúBếp", "Umami"],
    stats: { comments: 98, reposts: 520, sprouts: 4400, views: 57300 },
    article: {
      title: "Tủ bếp umami: 14 nguyên liệu, xếp hạng theo glutamate",
      source: "Tài liệu tham khảo của đầu bếp · 7 phút đọc",
      tone: "grain",
    },
  },
  {
    id: "showcase-noor",
    kind: "photo",
    publishedAt: "2026-09-08T08:05:00Z",
    author: authors.noor,
    body: "Bánh brioche aquafaba, lần thử thứ chín. Đánh aquafaba bông cứng, trộn bơ thực vật lạnh trong hai ngày. Ruột bánh mềm xốp như lông vũ và xé ra y như bánh thật.",
    tags: ["LàmBánhThuầnChay"],
    stats: { comments: 64, reposts: 132, sprouts: 1800, views: 19200 },
    photos: [{ alt: "Ổ brioche tết trên giá làm nguội", tone: "grain" }],
  },
];

export function getShowcasePosts(filter: FeedFilter): ShowcasePost[] {
  if (filter === "blogs") return showcasePosts.filter((post) => post.kind === "article");
  if (filter === "posts") return showcasePosts.filter((post) => post.kind !== "article");
  return showcasePosts;
}
