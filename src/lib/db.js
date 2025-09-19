import localforage from "localforage"

localforage.config({
  name: "talentflow",
  storeName: "tf_store",
  description: "TalentFlow local cache"
})

export const jobsStore = localforage.createInstance({ name: "talentflow", storeName: "jobs" })
export const candidatesStore = localforage.createInstance({ name: "talentflow", storeName: "candidates" })
export const timelinesStore = localforage.createInstance({ name: "talentflow", storeName: "timelines" })
export const assessmentsStore = localforage.createInstance({ name: "talentflow", storeName: "assessments" })
export const responsesStore = localforage.createInstance({ name: "talentflow", storeName: "responses" })

export async function getAll(store) {
  const keys = await store.keys()
  const arr = await Promise.all(keys.map(k => store.getItem(k)))
  return arr
}
