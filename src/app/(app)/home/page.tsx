import { TaskList } from "@/components/organisms/TaskList";
import { homeLabels } from "@/constants/home";

export default function HomePage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-heading">{homeLabels.title}</h1>
        <p className="text-sm text-body">{homeLabels.subtitle}</p>
      </header>
      <TaskList />
    </section>
  );
}
