// This service provides mock population statistics data for global trends and country-specific information

interface GlobalPopulation {
  year: number;
  population: number; // in billions
  growthRate: number; // percentage
}

interface CountryPopulation {
  countryCode: string;
  countryName: string;
  continent:
    | "Asia"
    | "Africa"
    | "Europe"
    | "North America"
    | "South America"
    | "Oceania";
  population: number; // in millions
  year: number;
  growthRate: number;
}

interface GlobalPopulationFilter {
  startYear?: number;
  endYear?: number;
}

interface CountryPopulationFilter {
  continent?: string;
  sortBy?: "population" | "growthRate";
  limit?: number;
  order?: "asc" | "desc";
}

const mockGlobalPopulation: GlobalPopulation[] = [
  { year: 2023, population: 8.045, growthRate: 0.88 },
  { year: 2022, population: 7.975, growthRate: 0.89 },
  { year: 2021, population: 7.909, growthRate: 0.9 },
  { year: 2020, population: 7.84, growthRate: 0.91 },
  { year: 2019, population: 7.713, growthRate: 1.05 },
  { year: 2018, population: 7.632, growthRate: 1.08 },
  { year: 2017, population: 7.55, growthRate: 1.12 },
  { year: 2016, population: 7.466, growthRate: 1.14 },
  { year: 2015, population: 7.381, growthRate: 1.19 },
  { year: 2014, population: 7.294, growthRate: 1.23 },
  { year: 2013, population: 7.205, growthRate: 1.24 },
  { year: 2012, population: 7.116, growthRate: 1.25 },
  { year: 2011, population: 7.028, growthRate: 1.26 },
  { year: 2010, population: 6.94, growthRate: 1.27 },
  { year: 2009, population: 6.853, growthRate: 1.28 },
  { year: 2008, population: 6.766, growthRate: 1.29 },
  { year: 2007, population: 6.679, growthRate: 1.3 },
  { year: 2006, population: 6.593, growthRate: 1.31 },
  { year: 2005, population: 6.507, growthRate: 1.32 },
  { year: 2004, population: 6.422, growthRate: 1.33 },
];

const mockCountryPopulation: CountryPopulation[] = [
  {
    countryCode: "CHN",
    countryName: "China",
    continent: "Asia",
    population: 1425.67,
    year: 2023,
    growthRate: 0.14,
  },
  {
    countryCode: "IND",
    countryName: "India",
    continent: "Asia",
    population: 1428.63,
    year: 2023,
    growthRate: 0.81,
  },
  {
    countryCode: "USA",
    countryName: "United States",
    continent: "North America",
    population: 339.99,
    year: 2023,
    growthRate: 0.59,
  },
  {
    countryCode: "IDN",
    countryName: "Indonesia",
    continent: "Asia",
    population: 277.53,
    year: 2023,
    growthRate: 0.89,
  },
  {
    countryCode: "PAK",
    countryName: "Pakistan",
    continent: "Asia",
    population: 235.82,
    year: 2023,
    growthRate: 1.98,
  },
  {
    countryCode: "BRA",
    countryName: "Brazil",
    continent: "South America",
    population: 215.31,
    year: 2023,
    growthRate: 0.52,
  },
  {
    countryCode: "NGA",
    countryName: "Nigeria",
    continent: "Africa",
    population: 213.4,
    year: 2023,
    growthRate: 2.41,
  },
  {
    countryCode: "DEU",
    countryName: "Germany",
    continent: "Europe",
    population: 83.2,
    year: 2023,
    growthRate: 0.12,
  },
  {
    countryCode: "AUS",
    countryName: "Australia",
    continent: "Oceania",
    population: 26.17,
    year: 2023,
    growthRate: 1.13,
  },
];

export const getGlobalPopulationTrend = async (
  filter?: GlobalPopulationFilter,
): Promise<GlobalPopulation[]> => {
  let filteredData = [...mockGlobalPopulation];

  if (filter) {
    if (filter.startYear) {
      filteredData = filteredData.filter(
        (data) => data.year >= filter.startYear!,
      );
    }
    if (filter.endYear) {
      filteredData = filteredData.filter(
        (data) => data.year <= filter.endYear!,
      );
    }
  }

  return filteredData.sort((a, b) => b.year - a.year);
};

export const getCountryPopulations = async (
  filter?: CountryPopulationFilter,
): Promise<CountryPopulation[]> => {
  let filteredData = [...mockCountryPopulation];

  if (filter) {
    // Filter by continent
    if (filter.continent) {
      filteredData = filteredData.filter(
        (country) => country.continent === filter.continent,
      );
    }

    // Sort data if sortBy is specified
    if (filter.sortBy) {
      filteredData.sort((a, b) => {
        const compareValue = filter.order === "asc" ? 1 : -1;
        return (a[filter.sortBy!] - b[filter.sortBy!]) * compareValue;
      });
    }

    // Apply limit for top/bottom N
    if (filter.limit && filter.limit > 0) {
      filteredData = filteredData.slice(0, filter.limit);
    }
  }

  return filteredData;
};

export type {
  CountryPopulation,
  CountryPopulationFilter,
  GlobalPopulation,
  GlobalPopulationFilter,
};
