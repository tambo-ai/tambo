import { z } from 'zod';

interface SWAPICharacter {
  name: string;
  species: string[];
  homeworld: string;
  films: string[];
}

interface SWAPIStarship {
  name: string;
  model: string;
  manufacturer: string;
  crew: string;
  passengers: string;
  max_atmosphering_speed: string;
  hyperdrive_rating: string;
}

async function fetchFromSWAPI(endpoint: string): Promise<unknown> {
  const response = await fetch(`https://swapi.dev/api/${endpoint}`);
  if (!response.ok) {
    throw new Error(`SWAPI request failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getCharacter(nameOrId: string) {
  try {
    // Try searching by name first
    const searchData = (await fetchFromSWAPI(
      `people/?search=${encodeURIComponent(nameOrId)}`,
    )) as { results: SWAPICharacter[] };

    if (searchData.results.length === 0) {
      return { error: 'Character not found' };
    }

    const character = searchData.results[0];

    // Fetch homeworld name
    const homeworldUrl = character.homeworld;
    const homeworldId = homeworldUrl.split('/').filter(Boolean).pop();
    const homeworld = (await fetchFromSWAPI(`planets/${homeworldId}`)) as { name: string };

    // Fetch species name
    let speciesName = 'Human';
    if (character.species.length > 0) {
      const speciesUrl = character.species[0];
      const speciesId = speciesUrl.split('/').filter(Boolean).pop();
      const species = (await fetchFromSWAPI(`species/${speciesId}`)) as { name: string };
      speciesName = species.name;
    }

    return {
      name: character.name,
      species: speciesName,
      homeworld: homeworld.name,
      films: character.films.length,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getStarship(nameOrId: string) {
  try {
    const searchData = (await fetchFromSWAPI(
      `starships/?search=${encodeURIComponent(nameOrId)}`,
    )) as { results: SWAPIStarship[] };

    if (searchData.results.length === 0) {
      return { error: 'Starship not found' };
    }

    const starship = searchData.results[0];

    return {
      name: starship.name,
      model: starship.model,
      manufacturer: starship.manufacturer,
      crew: starship.crew,
      passengers: starship.passengers,
      maxSpeed: starship.max_atmosphering_speed,
      hyperdriveRating: starship.hyperdrive_rating,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const swapiToolSchema = z
  .function()
  .args(
    z.object({
      type: z.enum(['character', 'starship']),
      name: z.string(),
    }),
  )
  .returns(z.unknown());
