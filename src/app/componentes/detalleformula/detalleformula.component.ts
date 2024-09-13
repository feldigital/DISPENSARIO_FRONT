import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormulaI } from 'src/app/modelos/formula.model';
import { FormulaService } from 'src/app/servicios/formula.service';

@Component({
  selector: 'app-detalleformula',
  templateUrl: './detalleformula.component.html',
  styleUrls: ['./detalleformula.component.css']
})
export class DetalleformulaComponent {
  formula!: FormulaI;
  titulo: string = 'Formula';

  constructor(private formulaService: FormulaService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(params => {
      let id = +params.get('id')!;
      this.formulaService.getFormulaId(id).subscribe(formula => this.formula = formula);
    });
  }

}
