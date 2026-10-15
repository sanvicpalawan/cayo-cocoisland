import type { ImageRef } from "@/cms/types";

/**
 * Genuine Cayo Coco photography on the resort's existing image CDN (Cloudflare resizing → AVIF/WebP).
 * Bare file names in content are served from here with responsive srcsets.
 */
const CDN = "https://assets.zyrosite.com/cdn-cgi/image";
const ACCOUNT = "YKbrlWyP5BUGlPjj";
const WIDTHS = [480, 768, 1080, 1440, 1920, 2560];

export const isCdnPath = (src = "") => /^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(src);

export function cdn(path: string, width: number) {
  return `${CDN}/format=auto,w=${width},fit=crop/${ACCOUNT}/${path}`;
}

export function srcSet(img: ImageRef) {
  if (!isCdnPath(img.src)) return undefined;
  const max = img.w ?? 2560;
  const widths = WIDTHS.filter((w) => w <= max);
  if (!widths.length) widths.push(max);
  return widths.map((w) => `${cdn(img.src, w)} ${w}w`).join(", ");
}

export function cdnTrim(path: string, trim: [number, number, number, number], width: number) {
  return `${CDN}/trim=${trim.join(";")},format=auto,w=${width}/${ACCOUNT}/${path}`;
}

const m = (src: string, w: number, h: number, alt: string, pos?: string): ImageRef => ({ src, w, h, alt, ...(pos ? { pos } : {}) });

export const media = {
  logo: m("whatsapp-image-2023-12-29-at-12.04.46-YX4XRELQX6I0prPE.jpeg", 650, 650, "Cayo Coco logo"),
  lagoonAerial: m("cayo_coco_edit-03531-AwvrJ6W18kTkv2DP.jpg", 3840, 2156, "Aerial view of the Cayo Coco cove: jungle-covered hills, a white-sand beach and the turquoise lagoon of Linapacan", "50% 45%"),
  beachAerial: m("kopie-von-cayococo-social-media-5-A1aQ4Mj38qf6y4pR.png", 2176, 2160, "The resort's beachfront from above, with thatched cottages and sun loungers beneath the palms"),
  sunsetCouple: m("sunset-couple-mjEvzv5bEzhM811O.JPG", 1349, 1349, "A couple holding hands, silhouetted against a Linapacan sunset"),
  oceanSuite1: m("cayo_coco_edit-02160-AQE4g25an2sW37kw.jpg", 3840, 2160, "Thatched bamboo Ocean Suite among the palms, steps from the beach"),
  oceanSuite2: m("cayo_coco_edit-02188-m2WlVvRgVquVvvlW.jpg", 3240, 2160, "The Ocean Suite at Cayo Coco"),
  oceanSuite3: m("cayo_coco_edit-02178-AR07wEQGJZc4WN0a.jpg", 3240, 2160, "Inside the semi-open-air Ocean Suite"),
  oceanSuite4: m("cayo_coco_edit-02229-AoP6jORMKOUbpwn1.jpg", 3500, 1969, "Ocean Suite details at Cayo Coco"),
  cottage1: m("cayo_coco_edit-03960-AVLzyqv21otZ4LlJ.jpg", 3240, 2160, "Coconut Cottage in the palm grove"),
  cottage2: m("cayo_coco_edit-04055-copy-2-dJoBn13Rjnu2kNWX.jpg", 3240, 2160, "The Coconut Cottage at Cayo Coco"),
  cottage3: m("cayo_coco_edit-04123-ALpOqa1KDrfz61V4.jpg", 3240, 2160, "Coconut Cottage surroundings"),
  cottage4: m("img_1843-2-AR0JVpklR1s9jDLa.png", 2880, 2160, "Coconut Cottage at Cayo Coco"),
  cottageInterior: m("2-A1awewQDRktzP9V3.jpg", 2508, 1672, "Bamboo cottage interior with a white daybed and woven walls"),
  beachDinnerDusk: m("cayo_coco_edit-05145-m6LDgog0a7UKraK4.jpg", 3240, 2160, "A candlelit table on the beach at dusk, framed by trees, lanterns and string lights", "50% 60%"),
  beachDinnerNight: m("cayo_coco_edit-05593-YNqpvZvlPlIJLa2B.jpg", 3240, 2160, "Lantern-lit private dinner table set on the sand"),
  beachDinnerSea: m("cayo_coco_edit-05560-AQE4NGKP49ujEQ6Z.jpg", 3240, 2160, "Beach dinner set up facing the sea at twilight"),
  restaurantSpread: m("cayo_coco_edit-05611-YBg8aWPxpLHKyBZ1.jpg", 3239, 2160, "Island-style dishes and tropical fruit decorated with frangipani at the Kingfisher Restaurant"),
  coconutDrink: m("cayo_coco_edit-04956-A85Zo4bXn6CPeQOe.jpg", 1440, 2160, "A fresh coconut drink with a frangipani flower above clear turquoise water"),
  plated1: m("416537159_909940574089542_464997629710140333_n-mxBlvEQ7rOs2p941.jpg", 1500, 2000, "A dish served at the Kingfisher Restaurant"),
  plated2: m("411271096_894644949028728_806353092694157703_n-YanMrOb9zPhpvEvv.jpg", 1500, 2000, "Food and drinks at the Kingfisher Restaurant"),
  foodBowls: m("food-smoothie-bowl-A0xw3wWWQNiL8BLE.jpg", 1620, 2160, "Freshly prepared bowls of island cuisine on a bamboo table"),
  breakfastMenu: m("breakfast-1-Yg25ZRqODVUMj30w.png", 1414, 2000, "The original illustrated Kingfisher Restaurant breakfast menu card"),
  coupleCocktails: m("couple-cocktails-YrDl3l6Bj2i0vZK7.jpg", 1200, 1600, "Guests toasting with cocktails on the beach"),
  finalDinner: m("final-night-dinner-2-m7Vw2wknPDsZkaM4.jpg", 2880, 2160, "Guests gathered around the table for an evening dinner"),
  friends: m("friends-cc-AR0yey7zkatZlRN3.JPG", 768, 768, "Guests wearing flower crowns during an evening celebration"),
  lagoonSwim: m("1-12-dOqyMy7NxbuDQDeP.jpg", 1439, 2160, "A guest wading through the clear turquoise shallows"),
  bonfire: m("1-2-d95KMK364xIZlae2.jpg", 1200, 1600, "A bonfire beneath a starry night sky on the island"),
  scuba: m("scuba-diving-cc-YZ9VMVXJlju6oNw4.jpg", 1620, 2160, "A scuba diver exploring a reef around the islands"),
  islandHopping: m("island-hopping-tour-cc-A0xw3wrvBGCR6M70.jpg", 1536, 2048, "Island hopping to uncrowded white-sand beaches"),
  massage: m("massage-cc-A0xw3wr7R0CLE7Bk.jpg", 2880, 2160, "A massage treatment at the beachfront"),
  reef: m("dsc00834-dWxwXBBg99FrjzGq.JPG", 3240, 2160, "The water around Cayo Coco's home reef"),
  townSquare: m("townsquare-el-nido-m7VK1e0RNwf5Obxa.jpg", 1200, 900, "Town Square in El Nido, the pick-up point for transfers to the island"),
};

/** Resort photo library offered in the admin image picker. */
export const LIBRARY: ImageRef[] = Object.values(media);

export const menuArt = {
  kingfisher: cdnTrim(media.breakfastMenu.src, [0, 0, 1240, 1000], 360),
  egg: cdnTrim(media.breakfastMenu.src, [1020, 1144, 540, 0], 240),
  fruitBowl: cdnTrim(media.breakfastMenu.src, [1380, 0, 260, 1060], 260),
  pancakes: cdnTrim(media.breakfastMenu.src, [1620, 1014, 0, 0], 260),
};
