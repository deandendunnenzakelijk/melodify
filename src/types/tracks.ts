import type { Tables } from '../lib/database.types';

export type TrackWithArtist = Tables<'tracks'> & {
  artist?: Pick<Tables<'artists'>, 'name'>;
};
