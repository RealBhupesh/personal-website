import GitHubActivity from "@/components/ui/github-activity";
import { githubUsername } from "@/config/github";
import { projectCounts, type ContributionProject } from "@/lib/github-contributions";

export function GitHubContributionActivity({ projects }: { projects: ContributionProject[] }) {
  return (
    <GitHubActivity
      username={githubUsername}
      showMonths
      accent={[
        "light-dark(#d6e8da, #244532)",
        "light-dark(#a4c8ad, #386a47)",
        "light-dark(#6ca77a, #559363)",
        "light-dark(#397d4b, #7bb788)",
      ]}
      label={`Pull requests in ${projects.length} projects`}
      style={{ width: "100%" }}
      repos={projects.map((item) => ({
        name: item.project,
        count: item.prs.length,
        description: projectCounts(item),
        href: item.repo,
        logo: (
          // GitHub's real owner avatars, rather than invented project marks.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://github.com/${item.repository.split("/")[0]}.png?size=64`} alt="" width={28} height={28} />
        ),
      }))}
    />
  );
}
