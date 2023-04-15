import { GITHUB_URL, LINKEDIN_URL } from '../constants/constant';

type MapTypedWordToUrl = {
  [propKey: string]: string;
};

export const mapTypedWordToUrl: MapTypedWordToUrl = {
  github: GITHUB_URL,
  linkedin: LINKEDIN_URL,
};
