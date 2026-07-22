"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EntityFilter, type FilterFieldConfig } from "@/components/shared/entity-filter.tsx";
import { HorseCard } from "@/components/horses/horse-card.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useHorseList } from "@/hooks/queries/useHorse.ts";
import { Link } from "@/i18n/navigation.ts";
import { horseBreedEnums, horseSexEnums } from "@/utils/enums.ts";
import { getCountrySelectOptions } from "@/components/shared/country-options.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import type { HorseListFilters } from "@/lib/services/horseService.ts";

export function HorseListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("horsesList");
  const tCreate = useTranslations("createHorse");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const locale = useLocale() as AppLocale;

  const filters: HorseListFilters = useMemo(() => ({
    mine: searchParams.get("mine") === "true" ? true : isAuthenticated ? true : undefined,
    forSale: searchParams.get("forSale") === "true" ? true : undefined,
    breed: searchParams.get("breed") ?? undefined,
    sex: searchParams.get("sex") ?? undefined,
    countryOfBirth: searchParams.get("location") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: 20,
  }), [searchParams, isAuthenticated]);

  const { data, isLoading: listLoading } = useHorseList(filters);

  const isLoading = authLoading || listLoading;

  const breedOptions = useMemo(
    () => [
      { value: "", label: t("anyBreed") },
      ...horseBreedEnums.map((v) => ({ value: v, label: tCreate(`breedOptions.${v}`) })),
    ],
    [t, tCreate],
  );

  const sexOptions = useMemo(
    () => [
      { value: "", label: t("anySex") },
      ...horseSexEnums.map((v) => ({ value: v, label: tCreate(`sexOptions.${v}`) })),
    ],
    [t, tCreate],
  );

  const countryOptions = useMemo(
    () => [
      { value: "", label: t("anyCountry"), flagCode: undefined },
      ...getCountrySelectOptions(locale).map((opt) => ({
        value: opt.value,
        label: opt.label,
        flagCode: opt.flagCode,
      })),
    ],
    [locale, t],
  );

  const filterFields: FilterFieldConfig[] = useMemo(() => {
    const fields: FilterFieldConfig[] = [];

    if (isAuthenticated) {
      fields.push({ key: "mine", label: t("mineLabel"), type: "toggle" });
    }

    fields.push(
      { key: "forSale", label: t("onSale"), type: "toggle" },
      { key: "breed", label: t("breed"), type: "select", options: breedOptions, placeholder: t("anyBreed") },
      { key: "sex", label: t("sex"), type: "select", options: sexOptions, placeholder: t("anySex") },
      { key: "location", label: t("location"), type: "flag-select", options: countryOptions, placeholder: t("anyCountry") },
    );

    return fields;
  }, [isAuthenticated, t, breedOptions, sexOptions, countryOptions]);

  function handleSearch(params: URLSearchParams) {
    if (params.toString()) {
      router.replace(`/horses?${params.toString()}`);
    } else {
      router.replace("/horses");
    }
  }

  if (isLoading) {
    return <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" />;
  }

  const horses = data?.horses ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const totalPages = Math.ceil(total / (data?.limit ?? 20));

  return (
    <>
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2 sm:px-6">
        <EntityFilter
          fields={filterFields}
          onSearch={handleSearch}
          createHref="/horses/new"
          createLabel={t("addHorse")}
        />
      </div>

      <div className="mx-auto flex w-full  flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
        {horses.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">{t("noResults")}</p>
            <Button variant="outline" onClick={() => {
            if (isAuthenticated) {
              router.push("/horses/new");
            } else {
              router.push(buildSignInPath("/horses/new"));
            }
          }}>
            {t("addHorse")}
          </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {horses.map((horse) => (
                <HorseCard key={horse.id} horse={horse} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {page > 1 ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-muted-foreground"
                    onClick={() => {
                      const p = new URLSearchParams(searchParams.toString());
                      p.set("page", String(page - 1));
                      router.replace(`/horses?${p.toString()}`);
                    }}
                  >
                    {t("prevPage")}
                  </Button>
                ) : null}
                <span>{t("pagination", { page, total: totalPages })}</span>
                {page < totalPages ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-muted-foreground"
                    onClick={() => {
                      const p = new URLSearchParams(searchParams.toString());
                      p.set("page", String(page + 1));
                      router.replace(`/horses?${p.toString()}`);
                    }}
                  >
                    {t("nextPage")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
