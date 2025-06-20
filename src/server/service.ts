interface allDataObject {
    id: number;
    value: string;
}

let allData: Array<allDataObject> = [];
let filteredData: Array<allDataObject> = []
let displayedData: Array<allDataObject>= []
let selectedIds: Array<allDataObject> = [] // maybe needs to be deserialized(array) and serialized back in frontend
let customOrder: any = []

export async function ClientInfoServiceGet() {
  if (allData.length === 0) {
  (() => { // IIFE - might go wrong
    for (let i = 1; i <= 1000000; i++) {
      allData.push({
        id: i,
        value: `${i}`,
      });
    }
    })();
  }

  return {
    allData,
    filteredData,
    displayedData,
    selectedIds,
    customOrder
  } // at least the alldata for now
}

export async function ClientInfoServicePost(filteredDataRecieved: any, displayedDataRecieved: any, selectedIdsRecieved: any, customOrderRecieved: any) {
    filteredData = filteredDataRecieved
    displayedData = displayedDataRecieved
    selectedIds = selectedIdsRecieved
    customOrder = customOrderRecieved
}
