import { find } from "lodash"
import { LooseClass, LooseObject } from "./types"

export interface IContainerProvider {
  userValue: any;
  token: string;
}
export class Container {
  private _providers: LooseObject = {}

  public resolve(token: string){
    const matchedProvider = find(
      this._providers,
      (_provider, key) => key === token
    )
    
    if(matchedProvider){
      return matchedProvider
    } else {
      throw new Error(`No provider found for ${token}`)
    }
  }

  public reserve(token: string, target: LooseClass) {
    container._providers[token] = new target()
  }

  public provider(details: IContainerProvider): void {
    this._providers[details.token] = details.userValue
  }
}

export const container = new Container()